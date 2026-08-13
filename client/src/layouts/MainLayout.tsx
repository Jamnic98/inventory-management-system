import { Outlet } from 'react-router-dom'

import { SideBar } from '../components'

export default function MainLayout() {
  return (
    <div className="flex h-dvh">
      <SideBar />
      <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
        <Outlet />
      </main>
    </div>
  )
}
