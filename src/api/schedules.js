export async function fetchSchedules(year, month) {
  const yearMonth = `${year}${String(month).padStart(2, '0')}`

  // 1) 정적 빌드 데이터에서 먼저 시도
  try {
    const res = await fetch(`/data/${yearMonth}.json`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) return data
    }
  } catch {}

  // 2) Netlify Function API 시도 (git 배포 시)
  try {
    const res = await fetch(`/api/schedules?yearMonth=${yearMonth}`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) return data
    }
  } catch {}

  // 3) 데이터 없음
  return []
}

export async function fetchScheduleDetail(houseManageNo, pblancNo, houseSecd) {
  try {
    const res = await fetch(`/api/schedule-detail?houseManageNo=${houseManageNo}&pblancNo=${pblancNo}&houseSecd=${houseSecd || '01'}`)
    if (!res.ok) throw new Error('API error')
    return await res.json()
  } catch {
    return null
  }
}
