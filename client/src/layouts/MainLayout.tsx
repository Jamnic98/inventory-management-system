import { Outlet } from 'react-router-dom'

import { SideBar } from '../components'

export default function MainLayout() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <SideBar />
      {/* Add pb-16 / pb-20 for mobile so content isn't hidden under the fixed bottom bar */}
      <main className="flex-1 p-4 pb-20 md:pb-4 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
