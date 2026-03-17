import { useState, useEffect } from 'react'
import { fetchSchedules } from '../api/schedules'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Calendar({
  currentDate,
  setCurrentDate,
  selectedTypes,
  selectedRegions,
  supplyTypes,
  onSelectSchedule,
}) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    setLoading(true)
    fetchSchedules(year, month + 1)
      .then(data => setSchedules(data))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false))
  }, [year, month])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const getSchedulesForDay = (day) => {
    if (!day) return []
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return schedules.filter(s => {
      return s.date === dateStr && selectedTypes.includes(s.type) && selectedRegions.includes(s.region)
    })
  }

  const getTypeColor = (typeKey) => {
    return supplyTypes.find(t => t.key === typeKey)?.color || '#6b7280'
  }

  const isToday = (day) => {
    return day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  }

  return (
    <div className="bg-white flex flex-col flex-1">
      {loading && (
        <div className="flex justify-center py-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent"></div>
        </div>
      )}

      {schedules.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400 text-sm">
          해당 월의 청약 데이터가 없습니다.
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-2.5 text-center text-xs font-semibold border-r border-gray-100 last:border-r-0 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const daySchedules = getSchedulesForDay(day)
          const dayOfWeek = idx % 7
          return (
            <div
              key={idx}
              className={`border-b border-r border-gray-100 p-1.5 flex flex-col min-h-[140px] ${
                !day ? 'bg-gray-50/50' : 'hover:bg-blue-50/30'
              }`}
            >
              {day && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday(day)
                          ? 'bg-blue-500 text-white'
                          : dayOfWeek === 0
                            ? 'text-red-400'
                            : dayOfWeek === 6
                              ? 'text-blue-400'
                              : 'text-gray-600'
                      }`}
                    >
                      {day}
                    </span>
                    {daySchedules.length > 0 && (
                      <span className="text-[10px] text-gray-300 font-semibold">{daySchedules.length}건</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5 overflow-y-auto">
                    {daySchedules.map((schedule, i) => (
                      <button
                        key={i}
                        onClick={() => onSelectSchedule(schedule)}
                        className="w-full text-left px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] leading-tight truncate block hover:opacity-70 transition-all"
                        style={{
                          backgroundColor: getTypeColor(schedule.type) + '18',
                          color: getTypeColor(schedule.type),
                          borderLeft: `3px solid ${getTypeColor(schedule.type)}`,
                        }}
                        title={`[${schedule.region}] ${schedule.name}`}
                      >
                        <span className="opacity-60">{schedule.region}</span> {schedule.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
