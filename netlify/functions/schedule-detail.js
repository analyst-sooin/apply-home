// Netlify Function: 청약홈 상세 공고 HTML 파싱 프록시
const PAGE_URL = 'https://www.applyhome.co.kr/ai/aib/selectSubscrptCalenderView.do'

// houseSecd에 따른 상세 API URL
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

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function parseDetailHtml(html) {
  const result = {}

  // 제목
  const titleMatch = html.match(/colspan="2"[^>]*>(.*?)<\/t[hd]>/s)
  result.title = titleMatch ? stripHtml(titleMatch[1]) : ''

  // 주요정보: 공급위치, 공급규모, 문의처
  const locMatch = html.match(/공급위치<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  result.location = locMatch ? stripHtml(locMatch[1]) : ''

  const scaleMatch = html.match(/공급규모<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  result.totalUnits = scaleMatch ? stripHtml(scaleMatch[1]) : ''

  const phoneMatch = html.match(/문의처<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  result.phone = phoneMatch ? stripHtml(phoneMatch[1]) : ''

  // 청약일정
  const announceMatch = html.match(/모집공고일<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  result.announceDate = announceMatch ? stripHtml(announceMatch[1]) : ''

  const winnerMatch = html.match(/당첨자 발표일<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  result.winnerDate = winnerMatch ? stripHtml(winnerMatch[1]) : ''

  const contractMatch = html.match(/계약일<\/th>\s*<td[^>]*>(.*?)<\/td>/s)
  result.contractDate = contractMatch ? stripHtml(contractMatch[1]) : ''

  // 접수기간
  const receiptRegex = /<td[^>]*>(특별공급|일반공급|1순위|2순위|무순위|임의공급)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>/gs
  result.receptions = []
  let m
  while ((m = receiptRegex.exec(html)) !== null) {
    result.receptions.push({
      type: stripHtml(m[1]),
      period: stripHtml(m[2]),
      method: stripHtml(m[3]),
    })
  }

  // 공급대상 테이블
  const supplySection = html.slice(
    html.indexOf('공급대상'),
    html.indexOf('공급내역') > -1 ? html.indexOf('공급내역') : html.indexOf('기타사항')
  )
  const supplyRowRegex = /<tr>(.*?)<\/tr>/gs
  result.supplyTargets = []
  while ((m = supplyRowRegex.exec(supplySection)) !== null) {
    const tds = [...m[1].matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map(t => stripHtml(t[1]))
    if (tds.length >= 4 && tds.some(t => t && t !== '')) {
      // Skip header-like rows and totals row
      if (!tds[0]?.includes('구분') && !tds[0]?.includes('주택')) {
        result.supplyTargets.push(tds)
      }
    }
  }

  // 공급금액 & 입주예정월
  const priceStart = html.indexOf('공급내역')
  const priceEnd = html.indexOf('기타사항')
  if (priceStart > -1 && priceEnd > -1) {
    const priceSection = html.slice(priceStart, priceEnd)
    const priceRowRegex = /<tr>(.*?)<\/tr>/gs
    result.prices = []
    while ((m = priceRowRegex.exec(priceSection)) !== null) {
      const tds = [...m[1].matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map(t => stripHtml(t[1]))
      if (tds.length >= 2 && tds[0] && !tds[0].includes('주택형')) {
        result.prices.push(tds)
      }
    }
  }

  // 기타사항 (시행사, 시공사, 전화번호)
  const etcSection = html.slice(html.lastIndexOf('기타사항'))
  const etcRowRegex = /<tr>(.*?)<\/tr>/gs
  while ((m = etcRowRegex.exec(etcSection)) !== null) {
    const tds = [...m[1].matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map(t => stripHtml(t[1]))
    if (tds.length >= 2 && tds[0] && !tds[0].includes('시행사')) {
      result.developer = tds[0] || ''
      result.constructor = tds[1] || ''
      result.devPhone = tds[2] || ''
      break
    }
  }

  // 모집공고문 다운로드 URL
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
