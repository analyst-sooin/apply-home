#!/usr/bin/env node
// 빌드 시 청약홈 API에서 데이터를 가져와 public/data/에 저장하는 스크립트
// Netlify 빌드 시 자동 실행 + 로컬에서도 수동 실행 가능

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'public', 'data')
const PAGE_URL = 'https://www.applyhome.co.kr/ai/aib/selectSubscrptCalenderView.do'
const API_URL = 'https://www.applyhome.co.kr/ai/aib/selectSubscrptCalender.do'

const TYPE_MAP = {
  '01': 'special', '02': 'first', '03': 'second',
  '04': 'public', '05': 'officetel', '06': 'unranked',
  '07': 'unranked', '08': 'special', '09': 'first',
  '10': 'second', '11': 'unranked',
}

async function getSessionCookies() {
  const res = await fetch(PAGE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  const setCookies = res.headers.getSetCookie?.() || []
  return setCookies.map(c => c.split(';')[0]).join('; ')
}

async function fetchMonth(yearMonth, cookies) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': PAGE_URL,
      'gvPgmId': 'AIB01M01',
      'ajaxAt': 'Y',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': cookies,
    },
    body: JSON.stringify({ reqData: { inqirePd: yearMonth } }),
  })

  if (!res.ok) throw new Error(`API ${res.status}`)

  const data = await res.json()
  if (data.exception) throw new Error(data.exception)

  const items = data.schdulList || []
  const year = yearMonth.slice(0, 4)
  const month = yearMonth.slice(4, 6)

  return items
    .filter(item => item.RESTDE_AT !== 'Y')
    .map(item => ({
      id: `${item.HOUSE_MANAGE_NO}-${item.PBLANC_NO}-${item.RCEPT_SE}`,
      name: item.HOUSE_NM,
      type: TYPE_MAP[item.RCEPT_SE] || 'first',
      typeCode: item.RCEPT_SE,
      region: item.SUBSCRPT_AREA_CODE_NM,
      date: `${year}-${month}-${String(item.IN_DAY).padStart(2, '0')}`,
      houseManageNo: item.HOUSE_MANAGE_NO,
      pblancNo: item.PBLANC_NO,
      houseSecd: item.HOUSE_SECD || '01',
    }))
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true })

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // 현재 월 기준 -2개월 ~ +6개월 범위 가져오기 (총 9개월)
  const months = []
  for (let offset = -2; offset <= 6; offset++) {
    let y = currentYear
    let m = currentMonth + offset
    if (m < 1) { y--; m += 12 }
    if (m > 12) { y++; m -= 12 }
    months.push(`${y}${String(m).padStart(2, '0')}`)
  }

  console.log(`[fetch-data] 청약홈 데이터 수집 시작: ${months.join(', ')}`)

  const index = {}

  for (const ym of months) {
    try {
      // 매 요청마다 새 세션 (안정성)
      const cookies = await getSessionCookies()
      const schedules = await fetchMonth(ym, cookies)

      fs.writeFileSync(
        path.join(DATA_DIR, `${ym}.json`),
        JSON.stringify(schedules, null, 0),
        'utf-8'
      )

      index[ym] = schedules.length
      console.log(`  ${ym}: ${schedules.length}건`)
    } catch (err) {
      console.warn(`  ${ym}: 실패 (${err.message})`)
      index[ym] = 0
      // 빈 파일이라도 생성해서 404 방지
      fs.writeFileSync(path.join(DATA_DIR, `${ym}.json`), '[]', 'utf-8')
    }
  }

  // 마지막 업데이트 시간 기록
  index._updatedAt = now.toISOString()

  fs.writeFileSync(
    path.join(DATA_DIR, 'index.json'),
    JSON.stringify(index, null, 2),
    'utf-8'
  )

  console.log(`[fetch-data] 완료! 총 ${Object.values(index).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0)}건`)
}

main().catch(err => {
  console.error('[fetch-data] 치명적 오류:', err)
  process.exit(1)
})
