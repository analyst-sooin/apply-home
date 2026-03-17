// Netlify Function: 청약홈 API 프록시
const CALENDAR_API = 'https://www.applyhome.co.kr/ai/aib/selectSubscrptCalender.do'
const PAGE_URL = 'https://www.applyhome.co.kr/ai/aib/selectSubscrptCalenderView.do'

// 공급유형 코드 매핑
const TYPE_MAP = {
  '01': 'special',    // APT 특별공급
  '02': 'first',      // APT 1순위
  '03': 'second',     // APT 2순위
  '04': 'public',     // 공공지원민간임대
  '05': 'officetel',  // 오피스텔/도시형
  '06': 'unranked',   // 무순위
  '07': 'unranked',   // 불법행위재공급
  '08': 'special',    // 민간사전청약 특별공급
  '09': 'first',      // 민간사전청약 1순위
  '10': 'second',     // 민간사전청약 2순위
  '11': 'unranked',   // 임의공급
}

async function getSessionCookies() {
  const res = await fetch(PAGE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
  })
  const cookies = res.headers.getSetCookie?.() || []
  return cookies.map(c => c.split(';')[0]).join('; ')
}

export default async (req) => {
  const url = new URL(req.url)
  const yearMonth = url.searchParams.get('yearMonth')

  if (!yearMonth || !/^\d{6}$/.test(yearMonth)) {
    return new Response(JSON.stringify({ error: 'yearMonth parameter required (YYYYMM)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const cookies = await getSessionCookies()

    const response = await fetch(CALENDAR_API, {
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

    if (!response.ok) throw new Error(`API returned ${response.status}`)

    const rawData = await response.json()
    const list = rawData.schdulList || []

    const year = yearMonth.slice(0, 4)
    const month = yearMonth.slice(4, 6)

    const schedules = list
      .filter(item => item.RESTDE_AT !== 'Y')
      .map((item) => {
        const day = String(item.IN_DAY).padStart(2, '0')
        return {
          id: `${item.HOUSE_MANAGE_NO}-${item.PBLANC_NO}-${item.RCEPT_SE}`,
          name: item.HOUSE_NM,
          type: TYPE_MAP[item.RCEPT_SE] || 'first',
          typeCode: item.RCEPT_SE,
          region: item.SUBSCRPT_AREA_CODE_NM,
          date: `${year}-${month}-${day}`,
          houseManageNo: item.HOUSE_MANAGE_NO,
          pblancNo: item.PBLANC_NO,
          houseSecd: item.HOUSE_SECD,
        }
      })

    return new Response(JSON.stringify(schedules), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config = {
  path: '/api/schedules',
}
