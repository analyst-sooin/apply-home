const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export default function MonthSelector({ year, month, setYear, setMonth }) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      {/* Year selector */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setYear(year - 1)}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xl font-bold text-gray-800 min-w-[80px] text-center">
          {year}년
        </span>
        <button
          onClick={() => setYear(year + 1)}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={() => {
            const now = new Date()
            setYear(now.getFullYear())
            setMonth(now.getMonth())
          }}
          className="ml-3 px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-500 rounded-full hover:bg-blue-100"
        >
          오늘
        </button>
      </div>

      {/* Month tabs */}
      <div className="flex gap-1">
        {MONTHS.map(m => (
          <button
            key={m}
            onClick={() => setMonth(m - 1)}
            className={`flex-1 py-2 text-sm font-semibold text-center rounded-lg transition-colors ${
              month === m - 1
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            {m}월
          </button>
        ))}
      </div>
    </div>
  )
}
