import { Route, Routes } from 'react-router-dom'

import { MainLayout } from './layouts'
import { Dashboard, Items, Locations, LoginVerify, Profile, Settings } from './pages'
import { useInventoryWebSocket } from './hooks/useInventoryWebSocket'

export default function App() {
  useInventoryWebSocket()

  return (
    <Routes>
      {/* Standalone Auth Route (No SideBar / App Frame) */}
      <Route path="login/verify" element={<LoginVerify />} />

      {/* Main App Shell Routes */}
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="items" element={<Items />} />
        <Route path="locations" element={<Locations />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
