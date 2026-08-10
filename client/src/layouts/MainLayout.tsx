import { Outlet } from 'react-router-dom'

import { SideBar } from '../components'

export default function MainLayout() {
  return (
    <div className="flex min-h-dvh">
      <SideBar />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}
