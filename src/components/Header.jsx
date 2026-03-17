export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SK</span>
          </div>
          <h1 className="text-lg font-bold text-gray-800">
            SkyKey <span className="text-blue-500">청약캘린더</span>
          </h1>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <a href="#" className="text-blue-500 font-semibold">청약일정</a>
          <a href="#" className="text-gray-400 hover:text-gray-600">청약가이드</a>
          <a href="#" className="text-gray-400 hover:text-gray-600">알림설정</a>
        </nav>
      </div>
    </header>
  )
}
