import { NavLink } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { LayoutDashboard, MapPinHouse, Package, Settings, type LucideIcon } from 'lucide-react'

const MIN_WIDTH = 180
const MAX_WIDTH = 400
const DEFAULT_WIDTH = 240
const MOBILE_BREAKPOINT = 768

interface NavItem {
  to: string
  label: string
  end?: boolean
  icon: LucideIcon
}

// TODO: move
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/items', label: 'Items', icon: Package },
  { to: '/locations', label: 'Locations', icon: MapPinHouse },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function SideBar() {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Default to mobile view below breakpoint
  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  // Drag-to-resize (desktop only)
  const startDragging = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const onMouseMove = (e: MouseEvent) => {
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX)))
    }
    const onMouseUp = () => setIsDragging(false)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging])

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-50 text-emerald-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  const tabClasses = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
      isActive ? 'text-emerald-600' : 'text-slate-500'
    }`

  // --- Mobile: fixed bottom tab bar ---
  if (isMobile) {
    return (
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={tabClasses}>
            {({ isActive }) => (
              <>
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    )
  }

  // --- Desktop: static, draggable-width sidebar ---
  return (
    <aside
      style={{ width: `${width}px` }}
      className="relative flex min-h-screen shrink-0 flex-col border-r border-slate-200 bg-white p-4"
    >
      <h2 className="text-lg font-semibold text-slate-900">IMS App</h2>
      <nav className="mt-6 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClasses}>
            <item.icon className="h-4.5 w-4.5" strokeWidth={1.8} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Drag handle */}
      <div
        onMouseDown={startDragging}
        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-emerald-400 ${
          isDragging ? 'bg-emerald-500' : 'bg-transparent'
        }`}
      />
    </aside>
  )
}
