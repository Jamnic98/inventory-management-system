import { Outlet } from 'react-router-dom'

import { MobileBottomBar, SideBar } from '../components'

export default function MainLayout() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Desktop Sidebar (hidden on mobile via CSS) */}
      <SideBar />

      {/* Main Content Area with padding at bottom for mobile bar */}
      <main className="flex-1 p-4 pb-20 md:pb-4 overflow-y-auto min-w-0">
        <Outlet />
      </main>

      {/* Fixed Mobile Bottom Navigation Bar (hidden on desktop via CSS) */}
      <MobileBottomBar />
    </div>
  )
}
