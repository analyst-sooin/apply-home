import { useState, useEffect } from 'react'
import { fetchScheduleDetail } from '../api/schedules'

export default function ScheduleModal({ schedule, supplyTypes, onClose }) {
  const typeInfo = supplyTypes.find(t => t.key === schedule.type)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!schedule.houseManageNo) { setError(true); return }
    setLoading(true); setError(false)
    fetchScheduleDetail(schedule.houseManageNo, schedule.pblancNo, schedule.houseSecd)
      .then(data => { if (data && data.title) setDetail(data); else setError(true) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [schedule])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="text-base font-bold text-gray-800">입주자모집공고 정보</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {loading && <Loading />}
          {error && !loading && <Fallback schedule={schedule} typeInfo={typeInfo} />}
          {detail && !loading && <Detail d={detail} />}
        </div>
      </div>
    </div>
  )
}

function Detail({ d }) {
  return (
    <>
      {/* 입주자모집공고 주요정보 */}
      <Sec>입주자모집공고 주요정보</Sec>
      <table className="w-full border-collapse mb-4">
        <tbody>
          <tr><td colSpan={2} className="border border-gray-200 bg-gray-50 text-center py-3 font-bold text-gray-800 text-lg">{d.title}</td></tr>
          <TR l="공급위치" v={d.location} />
          <TR l="공급규모" v={d.totalUnits} />
          <TR l="입주자모집공고 관련 문의" v="사업주체 또는 분양사무실로 문의" />
          <TR l="문의처" v={d.phone} />
        </tbody>
      </table>

      {/* 모집공고문 보기 */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6 gap-4">
        <p className="text-xs text-gray-500">* 입주자모집공고 관련사항은 사업주체 또는 분양사무실로 문의하시기 바랍니다.</p>
        {d.documentUrl && (
          <a href={d.documentUrl} target="_blank" rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition">
            모집공고문 보기
          </a>
        )}
      </div>

      {/* 청약일정 */}
      <Sec>청약일정</Sec>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <TR l="모집공고일" v={d.announceDate} />

          {/* 청약접수 - 해당지역/기타지역 or 단순 */}
          {d.receptions && d.receptions.length > 0 && d.receptionType === 'region' && (
            <>
              <tr>
                <th rowSpan={d.receptions.length + 1} className="border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 w-32 px-4 py-2 text-left align-top">청약접수</th>
                <td className="border border-gray-200 p-0">
                  <div className="grid grid-cols-4 text-center text-xs font-semibold text-gray-500 bg-gray-50 py-2">
                    <span>구분</span><span>해당지역</span><span>기타지역</span><span>접수장소</span>
                  </div>
                </td>
              </tr>
              {d.receptions.map((r, i) => (
                <tr key={i}>
                  <td className="border border-gray-200 p-0">
                    <div className="grid grid-cols-4 text-center text-sm py-2">
                      <span className="text-gray-700 font-medium">{r.type}</span>
                      <span className="text-gray-700">{r.local}</span>
                      <span className="text-gray-700">{r.other}</span>
                      <span className="text-gray-500">{r.method}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </>
          )}

          {d.receptions && d.receptions.length > 0 && d.receptionType === 'simple' && (
            <>
              <tr>
                <th rowSpan={d.receptions.length + 1} className="border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 w-32 px-4 py-2 text-left align-top">청약접수</th>
                <td className="border border-gray-200 p-0">
                  <div className="grid grid-cols-3 text-center text-xs font-semibold text-gray-500 bg-gray-50 py-2">
                    <span>구분</span><span>접수기간</span><span>접수장소</span>
                  </div>
                </td>
              </tr>
              {d.receptions.map((r, i) => (
                <tr key={i}>
                  <td className="border border-gray-200 p-0">
                    <div className="grid grid-cols-3 text-center text-sm py-2">
                      <span className="text-gray-700 font-medium">{r.type}</span>
                      <span className="text-gray-700">{r.period}</span>
                      <span className="text-gray-500">{r.method}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </>
          )}

          <TR l="당첨자 발표일" v={
            d.winnerUrl
              ? <>{d.winnerDate.replace(d.winnerUrl, '').replace(/[()]/g, '').trim()} (<a href={d.winnerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline break-all">{d.winnerUrl}</a>)</>
              : d.winnerDate
          } />
          <TR l="계약일" v={d.contractDate} />
        </tbody>
      </table>

      {/* 공급대상 */}
      {d.supplyRows && d.supplyRows.length > 0 && (
        <>
          <Sec>공급대상</Sec>
          <div className="overflow-x-auto mb-2">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th rowSpan={2} className="border border-gray-200 px-2 py-2 text-gray-600 font-semibold text-xs">주택<br/>구분</th>
                  <th rowSpan={2} className="border border-gray-200 px-2 py-2 text-gray-600 font-semibold text-xs">주택형</th>
                  <th rowSpan={2} className="border border-gray-200 px-2 py-2 text-gray-600 font-semibold text-xs">주택공급면적<br/><span className="font-normal text-gray-400">(주거전용+주거공용)</span></th>
                  <th colSpan={3} className="border border-gray-200 px-2 py-1 text-gray-600 font-semibold text-xs">공급세대수</th>
                  <th rowSpan={2} className="border border-gray-200 px-2 py-2 text-gray-600 font-semibold text-xs">주택관리번호<br/>(모델번호)</th>
                </tr>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-2 py-1 text-gray-600 font-semibold text-xs">일반</th>
                  <th className="border border-gray-200 px-2 py-1 text-gray-600 font-semibold text-xs">특별</th>
                  <th className="border border-gray-200 px-2 py-1 text-gray-600 font-semibold text-xs">계</th>
                </tr>
              </thead>
              <tbody>
                {d.supplyRows.map((row, i) => {
                  const isTotal = row[0] === '계' || row[1] === '계'
                  if (isTotal) {
                    const nums = row.filter(c => c !== '' && c !== '계')
                    return (
                      <tr key={i} className="bg-gray-50 font-semibold">
                        <td colSpan={3} className="border border-gray-200 px-3 py-2 text-center text-gray-700">계</td>
                        {nums.slice(0, 3).map((c, j) => <td key={j} className="border border-gray-200 px-3 py-2 text-center text-gray-700">{c}</td>)}
                        <td className="border border-gray-200"></td>
                      </tr>
                    )
                  }
                  return (
                    <tr key={i}>
                      {row.map((cell, j) => <td key={j} className="border border-gray-200 px-2 py-2 text-center text-gray-700 text-xs">{cell}</td>)}
                      {row.length < 7 && Array.from({ length: 7 - row.length }).map((_, j) => <td key={`e${j}`} className="border border-gray-200"></td>)}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-400 mb-1">* 공급세대수는 사업주체의 최초 입주자모집 공고문 기준입니다. 특별공급 신청 미달 시 잔여물량은 일반공급으로 전환됨에 따라 일반공급 세대 수가 변경될 수 있으므로 최종 일반공급 세대수는 일반공급 신청일에 '청약접수 경쟁률'에서 확인 또는 사업주체에 문의하시기 바랍니다.</p>
          <p className="text-[11px] text-gray-400 mb-6">* 주택형=주거전용면적(type이 있는 경우 type포함)</p>
        </>
      )}

      {/* 공급금액 */}
      {d.prices && d.prices.length > 0 && (
        <>
          <Sec>공급금액{d.priceHeaders?.some(h => h.includes('2순위')) ? ', 2순위 청약금' : ''} 및 입주예정월</Sec>
          <p className="text-xs text-gray-400 mb-2">공급금액(단위:만원)</p>
          <div className="overflow-x-auto mb-2">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {(d.priceHeaders && d.priceHeaders.length > 0 ? d.priceHeaders : ['주택형', '공급금액(최고가 기준)', '입주예정월']).map((h, i) => (
                    <th key={i} className="border border-gray-200 px-3 py-2 text-gray-600 font-semibold text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.prices.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border border-gray-200 px-3 py-2 text-center text-gray-700">{cell}</td>
                    ))}
                    {row.length < (d.priceHeaders?.length || 3) && Array.from({ length: (d.priceHeaders?.length || 3) - row.length }).map((_, j) => (
                      <td key={`e${j}`} className="border border-gray-200"></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {d.moveInDate && <p className="text-xs text-gray-600 mb-1">* 입주예정월 : {d.moveInDate}</p>}
          <p className="text-[11px] text-gray-400 mb-6">* 층별(동호수별) 세부 공급금액은 사업주체의 입주자모집 공고문을 참고하시기 바랍니다.</p>
        </>
      )}

      {/* 기타사항 */}
      {(d.developer || d.constructor) && (
        <>
          <Sec>기타사항</Sec>
          <table className="w-full border-collapse text-sm mb-2">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-gray-600 font-semibold text-xs">시행사</th>
                <th className="border border-gray-200 px-3 py-2 text-gray-600 font-semibold text-xs">시공사</th>
                <th className="border border-gray-200 px-3 py-2 text-gray-600 font-semibold text-xs">사업주체 전화번호</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-3 py-2 text-center text-gray-700">{d.developer}</td>
                <td className="border border-gray-200 px-3 py-2 text-center text-gray-700">{d.constructor}</td>
                <td className="border border-gray-200 px-3 py-2 text-center text-gray-700">{d.devPhone}</td>
              </tr>
            </tbody>
          </table>
          {d.notices && d.notices.length > 0 && (
            <div className="mb-6">
              {d.notices.map((n, i) => <p key={i} className="text-[11px] text-gray-400">{n}</p>)}
            </div>
          )}
        </>
      )}
    </>
  )
}

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-400 border-t-transparent mb-4"></div>
      <p className="text-sm text-gray-400">상세 정보를 불러오는 중...</p>
    </div>
  )
}

function Fallback({ schedule, typeInfo }) {
  return (
    <div className="text-center py-12">
      <h4 className="text-lg font-bold text-gray-800 mb-2">{schedule.name}</h4>
      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
        style={{ backgroundColor: (typeInfo?.color || '#6b7280') + '18', color: typeInfo?.color || '#6b7280' }}>
        {typeInfo?.label || schedule.type}
      </span>
      <div className="text-sm text-gray-500 space-y-1">
        <p>지역: {schedule.region}</p>
        <p>청약일: {schedule.date}</p>
      </div>
      <p className="mt-6 text-xs text-gray-400">Netlify Functions 배포 후 상세 정보를 확인할 수 있습니다.</p>
    </div>
  )
}

function Sec({ children }) {
  return <h4 className="text-base font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-800">{children}</h4>
}

function TR({ l, v }) {
  if (!v) return null
  return (
    <tr>
      <th className="border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 w-32 px-4 py-2.5 text-left">{l}</th>
      <td className="border border-gray-200 text-sm text-gray-700 px-4 py-2.5">{v}</td>
    </tr>
  )
}
