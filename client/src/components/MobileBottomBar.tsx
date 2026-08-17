import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  MapPinHouse,
  Package,
  Settings,
  User as UserIcon,
  Bell,
  CheckCheck,
  X,
  type LucideIcon,
  LayoutDashboard,
} from 'lucide-react'

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

export default function MobileBottomBar() {
  const { notifications = [], unreadCount = 0, markAllAsRead } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <>
      {/* Mobile Slide-up Notification Sheet */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setShowNotifications(false)}
        >
          <div
            className="bg-white rounded-t-2xl shadow-2xl max-h-[70vh] w-full overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-slate-50">
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
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 p-1 rounded active:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark read
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
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
                    className={`p-3.5 text-xs ${!n.isRead ? 'bg-amber-50/40 font-medium' : ''}`}
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

      {/* Fixed Bottom Tab Navigation Bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-lg md:hidden"
        aria-label="Mobile Navigation Bar"
      >
        {MAIN_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
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

        {/* Notifications Alert Button */}
        <button
          type="button"
          onClick={() => setShowNotifications((prev) => !prev)}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors cursor-pointer ${
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
              `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
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

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
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
