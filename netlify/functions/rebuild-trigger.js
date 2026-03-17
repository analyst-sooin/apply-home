// Netlify Scheduled Function: 매일 오전 9시(KST) 빌드 트리거
// 빌드를 다시 돌리면 fetch-data.js가 최신 청약 데이터를 가져옴

export default async () => {
  const buildHookUrl = process.env.NETLIFY_BUILD_HOOK_URL

  if (!buildHookUrl) {
    console.log('[rebuild] NETLIFY_BUILD_HOOK_URL 환경변수가 설정되지 않음. Netlify 대시보드에서 Build Hook을 만들고 환경변수에 등록하세요.')
    return new Response(JSON.stringify({ error: 'No build hook URL configured' }), { status: 500 })
  }

  try {
    const res = await fetch(buildHookUrl, { method: 'POST' })
    console.log(`[rebuild] 빌드 트리거 완료: ${res.status}`)
    return new Response(JSON.stringify({ triggered: true }), { status: 200 })
  } catch (err) {
    console.error('[rebuild] 실패:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}

// 매일 UTC 00:00 = KST 09:00
export const config = {
  schedule: '0 0 * * *',
}
