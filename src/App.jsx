import { useState } from 'react'
import './index.css'
import Calendar from './components/Calendar'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import MonthSelector from './components/MonthSelector'
import ScheduleModal from './components/ScheduleModal'

const SUPPLY_TYPES = [
  { key: 'special', label: '특별공급', color: '#8b5cf6' },
  { key: 'first', label: '1순위', color: '#3b82f6' },
  { key: 'second', label: '2순위', color: '#06b6d4' },
  { key: 'unranked', label: '무순위/잔여', color: '#10b981' },
  { key: 'officetel', label: '오피스텔/도시형', color: '#f59e0b' },
  { key: 'public', label: '공공지원민간임대', color: '#ef4444' },
]

const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '광주',
  '대전', '울산', '세종', '강원', '충북', '충남',
  '전북', '전남', '경북', '경남', '제주',
]

function App() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTypes, setSelectedTypes] = useState(SUPPLY_TYPES.map(t => t.key))
  const [selectedRegions, setSelectedRegions] = useState([...REGIONS])
  const [selectedSchedule, setSelectedSchedule] = useState(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const setYear = (y) => setCurrentDate(new Date(y, month, 1))
  const setMonth = (m) => setCurrentDate(new Date(year, m, 1))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <MonthSelector
        year={year}
        month={month}
        setYear={setYear}
        setMonth={setMonth}
      />
      <FilterBar
        supplyTypes={SUPPLY_TYPES}
        regions={REGIONS}
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        selectedRegions={selectedRegions}
        setSelectedRegions={setSelectedRegions}
      />
      <div className="flex-1 flex flex-col">
        <Calendar
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          selectedTypes={selectedTypes}
          selectedRegions={selectedRegions}
          supplyTypes={SUPPLY_TYPES}
          onSelectSchedule={setSelectedSchedule}
        />
      </div>
      {selectedSchedule && (
        <ScheduleModal
          schedule={selectedSchedule}
          supplyTypes={SUPPLY_TYPES}
          onClose={() => setSelectedSchedule(null)}
        />
      )}
    </div>
  )
}

export default App
