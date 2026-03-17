const PAGE_URL = 'https://www.applyhome.co.kr/ai/aib/selectSubscrptCalenderView.do'

function getDetailUrl(houseSecd) {
  if (houseSecd === '01' || houseSecd === '09') return '/ai/aia/selectAPTLttotPblancDetail.do'
  if (houseSecd === '04' || houseSecd === '06' || houseSecd === '11') return '/ai/aia/selectAPTRemndrLttotPblancDetailView.do'
  return '/ai/aia/selectPRMOLttotPblancDetailView.do'
}

async function getSessionCookies() {
  const res = await fetch(PAGE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
  })
  const cookies = res.headers.getSetCookie?.() || []
  return cookies.map(c => c.split(';')[0]).join('; ')
}

function strip(s) { return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() }

function parseRows(tableHtml, maxCols) {
  const rows = [...tableHtml.matchAll(/<tr>(.*?)<\/tr>/gs)].map(m => m[1])
  const result = []
  const pending = {}

  for (const row of rows) {
    const cells = [...row.matchAll(/<(th|td)([^>]*)>(.*?)<\/\1>/gs)]
    const isHeader = cells.every(c => c[1] === 'th')
    if (isHeader) continue

    const fullRow = []
    let ci = 0
    for (let col = 0; col < maxCols; col++) {
      if (pending[col] && pending[col].remaining > 0) {
        fullRow.push(pending[col].value)
        pending[col].remaining--
        if (pending[col].remaining <= 0) delete pending[col]
        continue
      }
      if (ci < cells.length) {
        const [, , attrs, content] = cells[ci]
        const text = strip(content)
        const rs = attrs.match(/rowspan="(\d+)"/)
        const cs = attrs.match(/colspan="(\d+)"/)
        if (rs && parseInt(rs[1]) > 1) pending[col] = { value: text, remaining: parseInt(rs[1]) - 1 }
        fullRow.push(text)
        const colspan = cs ? parseInt(cs[1]) : 1
        for (let c = 1; c < colspan; c++) { col++; fullRow.push('') }
        ci++
      }
    }
    if (fullRow.some(c => c !== '')) result.push(fullRow)
  }
  return result
}

function parseDetailHtml(html) {
  const r = {}

  // 제목
  const tm = html.match(/colspan="2"[^>]*>(.*?)<\/t[hd]>/s)
  r.title = tm ? strip(tm[1]) : ''

  // 주요정보
  r.location = (html.match(/공급위치<\/th>\s*<td[^>]*>(.*?)<\/td>/s) || [])[1]
  r.totalUnits = (html.match(/공급규모<\/th>\s*<td[^>]*>(.*?)<\/td>/s) || [])[1]
  r.phone = (html.match(/문의처<\/th>\s*<td[^>]*>(.*?)<\/td>/s) || [])[1]
  r.location = r.location ? strip(r.location) : ''
  r.totalUnits = r.totalUnits ? strip(r.totalUnits) : ''
  r.phone = r.phone ? strip(r.phone) : ''

  // 청약일정
  r.announceDate = ''
  const annM = html.match(/모집공고일<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  if (annM) r.announceDate = strip(annM[1])

  r.winnerDate = ''
  const winM = html.match(/당첨자 발표일<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  if (winM) {
    // URL이 포함될 수 있음
    let raw = winM[1]
    const urlM = raw.match(/href="([^"]*)"/)
    const text = strip(raw)
    r.winnerDate = text
    r.winnerUrl = urlM ? urlM[1] : null
  }

  r.contractDate = ''
  const conM = html.match(/계약일<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  if (conM) r.contractDate = strip(conM[1])

  // 접수기간 - 해당지역/기타지역 또는 단일 접수기간
  r.receptions = []
  const schedSection = html.slice(html.indexOf('청약접수'), html.indexOf('당첨자 발표일'))

  // 헤더 행에서 컬럼 구조 파악
  const hasRegionCols = schedSection.includes('해당지역') || schedSection.includes('기타지역')

  if (hasRegionCols) {
    r.receptionType = 'region' // 해당지역/기타지역 구조
    const rx = /<td[^>]*>(특별공급|일반공급|1순위|2순위|무순위|임의공급)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>/gs
    let m
    while ((m = rx.exec(schedSection)) !== null) {
      r.receptions.push({ type: strip(m[1]), local: strip(m[2]), other: strip(m[3]), method: strip(m[4]) })
    }
  } else {
    r.receptionType = 'simple'
    const rx = /<td[^>]*>(특별공급|일반공급|1순위|2순위|무순위|임의공급)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>/gs
    let m
    while ((m = rx.exec(schedSection)) !== null) {
      r.receptions.push({ type: strip(m[1]), period: strip(m[2]), method: strip(m[3]) })
    }
  }

  // 공급대상
  const supStart = html.indexOf('공급대상')
  const supEnd = html.indexOf('공급금액', supStart) > -1 ? html.indexOf('공급금액', supStart) : html.indexOf('공급내역', supStart) > -1 ? html.indexOf('공급내역', supStart) : html.indexOf('기타사항', supStart)
  const supSection = html.slice(supStart, supEnd)
  const supTable = supSection.match(/<table[^>]*>(.*?)<\/table>/s)
  r.supplyRows = supTable ? parseRows(supTable[1], 7) : []

  // 공급금액 - 헤더 동적 파싱
  const priceStart = html.indexOf('공급금액')
  const priceEnd = html.indexOf('기타사항', priceStart)
  r.prices = []
  r.priceHeaders = []
  r.moveInDate = ''

  if (priceStart > -1 && priceEnd > -1) {
    const priceSection = html.slice(priceStart, priceEnd)

    // 입주예정월
    const moveM = priceSection.match(/입주예정월\s*[:：]?\s*([^\n<]+)/)
    if (moveM) r.moveInDate = strip(moveM[1])
    // 또는 별도 표기
    const moveM2 = html.match(/입주예정월[^<]*<[^>]*>[^<]*<[^>]*>(.*?)<\/td>/s)
    if (!r.moveInDate && moveM2) r.moveInDate = strip(moveM2[1])

    const priceTable = priceSection.match(/<table[^>]*>(.*?)<\/table>/s)
    if (priceTable) {
      // 헤더 추출
      const headerRow = priceTable[1].match(/<tr>(.*?)<\/tr>/s)
      if (headerRow) {
        const ths = [...headerRow[1].matchAll(/<th[^>]*>(.*?)<\/th>/gs)]
        r.priceHeaders = ths.map(m => strip(m[1]))
      }
      r.prices = parseRows(priceTable[1], r.priceHeaders.length || 3)
    }
  }

  // 기타사항
  const etcSection = html.slice(html.lastIndexOf('기타사항'))
  const etcTable = etcSection.match(/<table[^>]*>(.*?)<\/table>/s)
  r.developer = ''
  r.constructor = ''
  r.devPhone = ''
  if (etcTable) {
    const rows = [...etcTable[1].matchAll(/<tr>(.*?)<\/tr>/gs)]
    for (const [, row] of rows) {
      const tds = [...row.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map(m => strip(m[1]))
      if (tds.length >= 2 && tds[0] && !tds[0].includes('시행사')) {
        r.developer = tds[0]
        r.constructor = tds[1]
        r.devPhone = tds[2] || ''
        break
      }
    }
  }

  // 하단 안내 텍스트
  r.notices = []
  const liMatches = [...etcSection.matchAll(/<li[^>]*>(.*?)<\/li>/gs)]
  for (const m of liMatches) {
    const text = strip(m[1])
    if (text) r.notices.push(text)
  }

  // 모집공고문 URL
  const docM = html.match(/href="([^"]*)"[^>]*>[^<]*모집공고문[^<]*</)
  r.documentUrl = docM ? docM[1] : null

  return r
}

export default async (req) => {
  const url = new URL(req.url)
  const houseManageNo = url.searchParams.get('houseManageNo')
  const pblancNo = url.searchParams.get('pblancNo')
  const houseSecd = url.searchParams.get('houseSecd') || '01'

  if (!houseManageNo || !pblancNo) {
    return new Response(JSON.stringify({ error: 'params required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const cookies = await getSessionCookies()
    const response = await fetch(`https://www.applyhome.co.kr${getDetailUrl(houseSecd)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': PAGE_URL, 'Cookie': cookies,
      },
      body: `houseManageNo=${houseManageNo}&pblancNo=${pblancNo}&houseSecd=${houseSecd}`,
    })

    if (!response.ok) throw new Error(`Status: ${response.status}`)
    const html = await response.text()

    if (html.includes('에러페이지') || html.includes('관리자에게 문의')) {
      return new Response(JSON.stringify({ error: 'Data not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify(parseDetailHtml(html)), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 502, headers: { 'Content-Type': 'application/json' } })
  }
}

export const config = { path: '/api/schedule-detail' }
