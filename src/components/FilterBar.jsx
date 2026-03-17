export default function FilterBar({
  supplyTypes,
  regions,
  selectedTypes,
  setSelectedTypes,
  selectedRegions,
  setSelectedRegions,
}) {
  const toggleType = (key) => {
    setSelectedTypes(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const toggleRegion = (region) => {
    setSelectedRegions(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    )
  }

  const toggleAllRegions = () => {
    setSelectedRegions(prev =>
      prev.length === regions.length ? [] : [...regions]
    )
  }

  const toggleAllTypes = () => {
    setSelectedTypes(prev =>
      prev.length === supplyTypes.length ? [] : supplyTypes.map(t => t.key)
    )
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-3">
      {/* 공급유형 */}
      <div>
        <div className="text-xs font-semibold text-gray-500 mb-2">공급유형</div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          <button
            onClick={toggleAllTypes}
            className={`py-2.5 text-sm font-semibold rounded-lg text-center transition-all ${
              selectedTypes.length === supplyTypes.length
                ? 'bg-gray-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {supplyTypes.map(type => (
            <button
              key={type.key}
              onClick={() => toggleType(type.key)}
              className="py-2.5 text-sm font-semibold rounded-lg text-center transition-all"
              style={{
                backgroundColor: selectedTypes.includes(type.key) ? type.color + '20' : '#f3f4f6',
                color: selectedTypes.includes(type.key) ? type.color : '#9ca3af',
                border: selectedTypes.includes(type.key) ? `2px solid ${type.color}40` : '2px solid transparent',
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* 지역 */}
      <div>
        <div className="text-xs font-semibold text-gray-500 mb-2">지역</div>
        <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-18 gap-2">
          <button
            onClick={toggleAllRegions}
            className={`py-2.5 text-sm font-semibold rounded-lg text-center transition-all ${
              selectedRegions.length === regions.length
                ? 'bg-gray-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {regions.map(region => (
            <button
              key={region}
              onClick={() => toggleRegion(region)}
              className={`py-2.5 text-sm font-semibold rounded-lg text-center transition-all ${
                selectedRegions.includes(region)
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
