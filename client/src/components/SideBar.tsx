import { NavLink } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import {
  MapPinHouse,
  Package,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  User as UserIcon,
  Bell,
  CheckCheck,
  X,
  type LucideIcon,
  LayoutDashboard,
} from 'lucide-react'

import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'

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
  const { notifications = [], unreadCount = 0, markAllAsRead } = useNotifications()

  // Initialize with actual window width to avoid initial layout flash on load
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  )
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  // Close notifications popover on click outside (Desktop)
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

  // Display defaults for single-user / local mode
  const displayName = user?.name || user?.email || 'Home User'
  const displaySubtext = user?.email || '-'
  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U'

  // --- Mobile: Fixed Bottom Tab Bar ---
  if (isMobile) {
    return (
      <>
        {/* Mobile Slide-up Sheet Overlay */}
        {showNotifications && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowNotifications(false)}
          >
            <div
              className="bg-white rounded-t-2xl shadow-2xl max-h-[70vh] w-full overflow-hidden animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 p-1 rounded hover:bg-emerald-50 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto divide-y divide-slate-100 max-h-[50vh]">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notifications right now
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs ${!n.isRead ? 'bg-amber-50/40 font-medium' : ''}`}
                    >
                      <div className="flex items-center justify-between text-slate-900 font-semibold mb-0.5">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Nav Bar */}
        <nav
          className="fixed inset-x-0 bottom-0 z-50 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-lg"
          aria-label="Primary Mobile Navigation"
        >
          {MAIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'font-semibold text-emerald-600'
                    : 'text-slate-500 hover:text-slate-800'
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

          {/* Notifications Alerts Button */}
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors cursor-pointer ${
              showNotifications
                ? 'font-semibold text-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Bell className="h-5 w-5" strokeWidth={showNotifications ? 2.2 : 1.8} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span>Alerts</span>
          </button>

          {SETTINGS_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'font-semibold text-emerald-600'
                    : 'text-slate-500 hover:text-slate-800'
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

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${
                isActive ? 'font-semibold text-emerald-600' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <UserIcon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
                <span>Profile</span>
              </>
            )}
          </NavLink>
        </nav>
      </>
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

        {/* Desktop Notifications Toggle Button */}
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

        {/* Desktop Notifications Popover */}
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
              <span className="truncate text-xs text-slate-500">{displaySubtext}</span>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
