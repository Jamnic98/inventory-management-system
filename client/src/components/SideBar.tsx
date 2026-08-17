import { NavLink } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import {
  MapPinHouse,
  Package,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  CheckCheck,
  type LucideIcon,
  LayoutDashboard,
} from 'lucide-react'

import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'

interface NavItem {
  to: string
  label: string
  end?: boolean
  icon: LucideIcon
}

const MAIN_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/items', label: 'Items', icon: Package },
  { to: '/locations', label: 'Locations', icon: MapPinHouse },
]

const SETTINGS_NAV_ITEMS: NavItem[] = [{ to: '/settings', label: 'Settings', icon: Settings }]

export default function SideBar() {
  const { user } = useAuth()
  const { notifications = [], unreadCount = 0, markAllAsRead } = useNotifications()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  const displayName = user?.name || user?.email || 'Home User'
  const displaySubtext = user?.email || '-'
  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <aside
      className={`hidden md:flex relative min-h-screen shrink-0 flex-col border-r border-slate-200 bg-white p-3 transition-all duration-300 ease-in-out ${
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
          <span className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
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
      <div className="mt-6 flex flex-col gap-1 relative" ref={popoverRef}>
        {!isCollapsed && (
          <span className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            System
          </span>
        )}

        <button
          type="button"
          onClick={() => setShowNotifications((prev) => !prev)}
          title={isCollapsed ? 'Notifications' : undefined}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          } ${
            showNotifications
              ? 'bg-emerald-50 text-emerald-700 font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Bell className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {!isCollapsed && <span>Notifications</span>}
        </button>

        {/* Notifications Popover */}
        {showNotifications && (
          <div
            className={`absolute z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden ${
              isCollapsed ? 'left-16 top-0' : 'left-full ml-2 top-0'
            }`}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
              <span className="font-semibold text-sm text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark read
                </button>
              )}
            </div>
            <div className="max-h-75 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`p-3 text-xs ${!n.isRead ? 'bg-amber-50/40' : ''}`}>
                    <div className="font-semibold text-slate-900 mb-0.5">{n.title}</div>
                    <div className="text-slate-600">{n.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
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

      {/* Footer Profile Link */}
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
              <span className="truncate text-xs text-slate-500">{displaySubtext}</span>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
