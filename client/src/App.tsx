import { Route, Routes } from 'react-router-dom'

import { MainLayout } from './layouts'
import { Dashboard, Items, Locations, Settings } from './pages'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="items" element={<Items />} />
        <Route path="locations" element={<Locations />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
