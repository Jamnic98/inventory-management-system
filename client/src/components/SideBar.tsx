import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  MapPinHouse,
  Package,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  User as UserIcon,
  type LucideIcon,
  LayoutDashboard,
} from 'lucide-react'

import { useAuth } from '../hooks/useAuth'

const MOBILE_BREAKPOINT = 768

interface NavItem {
  to: string
  label: string
  end?: boolean
  icon: LucideIcon
}

// Main Navigation
const MAIN_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/items', label: 'Items', icon: Package },
  { to: '/locations', label: 'Locations', icon: MapPinHouse },
]

// System / Utilities
const SETTINGS_NAV_ITEMS: NavItem[] = [{ to: '/settings', label: 'Settings', icon: Settings }]

export default function SideBar() {
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  // Display defaults for single-user / local mode
  const displayName = user?.name || user?.email || 'Home User'
  const displaySubtext = user?.email || '-'
  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U'

  // --- Mobile: Fixed Bottom Tab Bar ---
  if (isMobile) {
    const mobileNavItems: NavItem[] = [
      ...MAIN_NAV_ITEMS,
      ...SETTINGS_NAV_ITEMS,
      { to: '/profile', label: 'Profile', icon: UserIcon }, // Replaced Logout with Profile tab
    ]

    return (
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-lg"
        aria-label="Primary Mobile Navigation"
      >
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                isActive ? 'font-semibold text-emerald-600' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
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

  // --- Desktop: Collapsible Sidebar ---
  return (
    <aside
      className={`relative flex min-h-screen shrink-0 flex-col border-r border-slate-200 bg-white p-3 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Header & Toggle */}
      <div className="flex items-center justify-between px-1 py-2">
        {!isCollapsed && (
          <span className="text-base font-bold text-slate-900 truncate">IMS App</span>
        )}
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Main Section */}
      <div className="mt-6 flex flex-col gap-1">
        {!isCollapsed && (
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Main
          </span>
        )}
        {MAIN_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isCollapsed ? 'justify-center px-0' : ''
              } ${
                isActive
                  ? 'bg-emerald-50 font-semibold text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>

      {/* Settings Section */}
      <div className="mt-6 flex flex-col gap-1">
        {!isCollapsed && (
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            System
          </span>
        )}
        {SETTINGS_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isCollapsed ? 'justify-center px-0' : ''
              } ${
                isActive
                  ? 'bg-emerald-50 font-semibold text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>

      {/* Desktop Footer (Profile Link + Logout Button) */}
      <div className="mt-auto border-t border-slate-200 pt-3">
        <NavLink
          to="/profile"
          title={isCollapsed ? displayName : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg p-2 transition-colors ${
              isActive ? 'bg-emerald-50' : 'bg-slate-50 hover:bg-slate-100'
            } ${isCollapsed ? 'justify-center' : ''}`
          }
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm">
            {userInitial}
          </div>

          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="truncate text-xs font-semibold text-slate-800">{displayName}</span>
              <span className="truncate text-[11px] text-slate-500">{displaySubtext}</span>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
