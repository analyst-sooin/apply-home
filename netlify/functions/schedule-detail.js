// Netlify Function: 청약홈 상세 공고 HTML 파싱 프록시
const PAGE_URL = 'https://www.applyhome.co.kr/ai/aib/selectSubscrptCalenderView.do'

// houseSecd에 따른 상세 API URL (모두 form submit → HTML 반환)
function getDetailUrl(houseSecd) {
  if (houseSecd === '01' || houseSecd === '09') {
    return '/ai/aia/selectAPTLttotPblancDetail.do'
  }
  if (houseSecd === '04' || houseSecd === '06' || houseSecd === '11') {
    return '/ai/aia/selectAPTRemndrLttotPblancDetailView.do'
  }
  return '/ai/aia/selectPRMOLttotPblancDetailView.do'
}

async function getSessionCookies() {
  const res = await fetch(PAGE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
  })
  const cookies = res.headers.getSetCookie?.() || []
  return cookies.map(c => c.split(';')[0]).join('; ')
}

function strip(str) {
  return str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function parseDetailHtml(html) {
  const result = {}

  // 제목
  const titleMatch = html.match(/colspan="2"[^>]*>(.*?)<\/t[hd]>/s)
  result.title = titleMatch ? strip(titleMatch[1]) : ''

  // 주요정보
  const locMatch = html.match(/공급위치<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  result.location = locMatch ? strip(locMatch[1]) : ''

  const scaleMatch = html.match(/공급규모<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  result.totalUnits = scaleMatch ? strip(scaleMatch[1]) : ''

  const phoneMatch = html.match(/문의처<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  result.phone = phoneMatch ? strip(phoneMatch[1]) : ''

  // 청약일정
  const announceMatch = html.match(/모집공고일<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  result.announceDate = announceMatch ? strip(announceMatch[1]) : ''

  const winnerMatch = html.match(/당첨자 발표일<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  result.winnerDate = winnerMatch ? strip(winnerMatch[1]) : ''

  const contractMatch = html.match(/계약일<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  result.contractDate = contractMatch ? strip(contractMatch[1]) : ''

  // 접수기간
  const receiptRegex = /<td[^>]*>(특별공급|일반공급|1순위|2순위|무순위|임의공급)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>/gs
  result.receptions = []
  let m
  while ((m = receiptRegex.exec(html)) !== null) {
    result.receptions.push({
      type: strip(m[1]),
      period: strip(m[2]),
      method: strip(m[3]),
    })
  }

  // 공급대상 - rowspan 처리
  const supplyStart = html.indexOf('공급대상')
  const supplyEnd = html.indexOf('공급내역', supplyStart) > -1
    ? html.indexOf('공급내역', supplyStart)
    : html.indexOf('기타사항', supplyStart)
  const supplySection = html.slice(supplyStart, supplyEnd)
  const supplyTable = supplySection.match(/<table[^>]*>(.*?)<\/table>/s)

  result.supplyHeaders = []
  result.supplyRows = []

  if (supplyTable) {
    const rows = [...supplyTable[1].matchAll(/<tr>(.*?)<\/tr>/gs)].map(m => m[1])

    // 첫 2행은 헤더 (rowspan/colspan으로 2행)
    // 데이터 행부터 파싱, rowspan 추적
    const pendingRowspans = {} // colIndex -> { value, remaining }

    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri]
      const cellMatches = [...row.matchAll(/<(th|td)([^>]*)>(.*?)<\/\1>/gs)]

      // 헤더 행 건너뛰기 (th만 있는 행)
      const isHeader = cellMatches.every(c => c[1] === 'th')
      if (isHeader) continue

      // 데이터 행 처리
      const fullRow = []
      let cellIdx = 0

      for (let col = 0; col < 7; col++) {
        // 이전 행의 rowspan이 남아있으면 해당 값 사용
        if (pendingRowspans[col] && pendingRowspans[col].remaining > 0) {
          fullRow.push(pendingRowspans[col].value)
          pendingRowspans[col].remaining--
          if (pendingRowspans[col].remaining <= 0) delete pendingRowspans[col]
          continue
        }

        if (cellIdx < cellMatches.length) {
          const [, , attrs, content] = cellMatches[cellIdx]
          const text = strip(content)
          const rowspanMatch = attrs.match(/rowspan="(\d+)"/)
          const colspanMatch = attrs.match(/colspan="(\d+)"/)
          const rowspan = rowspanMatch ? parseInt(rowspanMatch[1]) : 1
          const colspan = colspanMatch ? parseInt(colspanMatch[1]) : 1

          fullRow.push(text)

          if (rowspan > 1) {
            pendingRowspans[col] = { value: text, remaining: rowspan - 1 }
          }

          // colspan > 1이면 추가 칼럼도 채움
          for (let cs = 1; cs < colspan; cs++) {
            col++
            fullRow.push('')
          }

          cellIdx++
        }
      }

      if (fullRow.some(c => c !== '')) {
        result.supplyRows.push(fullRow)
      }
    }
  }

  // 공급금액 & 입주예정월
  const priceStart = html.indexOf('공급내역')
  const priceEnd = html.indexOf('기타사항', priceStart)
  result.prices = []
  if (priceStart > -1 && priceEnd > -1) {
    const priceSection = html.slice(priceStart, priceEnd)
    const priceTable = priceSection.match(/<table[^>]*>(.*?)<\/table>/s)
    if (priceTable) {
      const rows = [...priceTable[1].matchAll(/<tr>(.*?)<\/tr>/gs)]
      const pendingRS = {}
      for (const [, row] of rows) {
        const cells = [...row.matchAll(/<(th|td)([^>]*)>(.*?)<\/\1>/gs)]
        if (cells.every(c => c[1] === 'th')) continue

        const fullRow = []
        let ci = 0
        for (let col = 0; col < 4; col++) {
          if (pendingRS[col] && pendingRS[col].remaining > 0) {
            fullRow.push(pendingRS[col].value)
            pendingRS[col].remaining--
            if (pendingRS[col].remaining <= 0) delete pendingRS[col]
            continue
          }
          if (ci < cells.length) {
            const [, , attrs, content] = cells[ci]
            const text = strip(content)
            const rs = attrs.match(/rowspan="(\d+)"/)
            if (rs && parseInt(rs[1]) > 1) {
              pendingRS[col] = { value: text, remaining: parseInt(rs[1]) - 1 }
            }
            fullRow.push(text)
            ci++
          }
        }
        if (fullRow.some(c => c && c !== '비고')) {
          result.prices.push(fullRow)
        }
      }
    }
  }

  // 기타사항
  const etcSection = html.slice(html.lastIndexOf('기타사항'))
  const etcTable = etcSection.match(/<table[^>]*>(.*?)<\/table>/s)
  if (etcTable) {
    const rows = [...etcTable[1].matchAll(/<tr>(.*?)<\/tr>/gs)]
    for (const [, row] of rows) {
      const tds = [...row.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map(m => strip(m[1]))
      if (tds.length >= 2 && tds[0] && !tds[0].includes('시행사')) {
        result.developer = tds[0] || ''
        result.constructor = tds[1] || ''
        result.devPhone = tds[2] || ''
        break
      }
    }
  }

  // 모집공고문 URL
  const docMatch = html.match(/href="([^"]*)"[^>]*>[^<]*모집공고문[^<]*</)
  result.documentUrl = docMatch ? docMatch[1] : null

  return result
}

export default async (req) => {
  const url = new URL(req.url)
  const houseManageNo = url.searchParams.get('houseManageNo')
  const pblancNo = url.searchParams.get('pblancNo')
  const houseSecd = url.searchParams.get('houseSecd') || '01'

  if (!houseManageNo || !pblancNo) {
    return new Response(JSON.stringify({ error: 'houseManageNo and pblancNo required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const cookies = await getSessionCookies()
    const detailPath = getDetailUrl(houseSecd)

    const response = await fetch(`https://www.applyhome.co.kr${detailPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': PAGE_URL,
        'Cookie': cookies,
      },
      body: `houseManageNo=${houseManageNo}&pblancNo=${pblancNo}&houseSecd=${houseSecd}`,
    })

    if (!response.ok) throw new Error(`Status: ${response.status}`)

    const html = await response.text()

    if (html.includes('에러페이지') || html.includes('관리자에게 문의')) {
      return new Response(JSON.stringify({ error: 'Data not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const parsed = parseDetailHtml(html)

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config = {
  path: '/api/schedule-detail',
}
