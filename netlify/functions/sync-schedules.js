// Netlify Scheduled Function: 매일 청약 데이터 동기화
const PAGE_URL = 'https://www.applyhome.co.kr/ai/aib/selectSubscrptCalenderView.do'
const CALENDAR_API = 'https://www.applyhome.co.kr/ai/aib/selectSubscrptCalender.do'

async function getSessionCookies() {
  const res = await fetch(PAGE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  })
  const cookies = res.headers.getSetCookie?.() || []
  return cookies.map(c => c.split(';')[0]).join('; ')
}

export default async () => {
  const today = new Date()
  const yearMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`

  console.log(`[Sync] ${yearMonth} 청약 데이터 동기화 시작`)

  try {
    const cookies = await getSessionCookies()

    const response = await fetch(CALENDAR_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': PAGE_URL,
        'gvPgmId': 'AIB01M01',
        'ajaxAt': 'Y',
        'Cookie': cookies,
      },
      body: JSON.stringify({ reqData: { inqirePd: yearMonth } }),
    })

    if (!response.ok) throw new Error(`Status: ${response.status}`)

    const data = await response.json()
    const count = data.schdulList?.length || 0

    console.log(`[Sync] ${count}건 동기화 완료`)

    // TODO: 새로운 청약 건 감지 시 회원 알림 발송
    return new Response(JSON.stringify({ synced: count, yearMonth }), { status: 200 })
  } catch (error) {
    console.error('[Sync] 실패:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export const config = {
  schedule: '0 0 * * *',
}
