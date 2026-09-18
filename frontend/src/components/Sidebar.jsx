import { useEffect, useState, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  UserCog,
  MessageCircle,
  MapPin,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import axiosInstance from '../api/axiosInstance'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'CUSTOMER', 'DRIVER'] },
  { to: '/shipments', label: 'Shipments', icon: Package, roles: ['ADMIN', 'CUSTOMER', 'DRIVER'] },
  { to: '/drivers', label: 'Drivers', icon: Truck, roles: ['ADMIN'] },
  { to: '/my-location', label: 'My Location', icon: MapPin, roles: ['DRIVER'] },
  { to: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN'] },
  { to: '/messages', label: 'Messages', icon: MessageCircle, roles: ['ADMIN', 'CUSTOMER', 'DRIVER'], showUnreadBadge: true },
  { to: '/users', label: 'Users', icon: UserCog, roles: ['ADMIN'] },
]

export default function Sidebar({ open = false, onClose }) {
  const { user } = useAuth()
  const role = user?.role || ''
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/messages/unread-count')
      setUnreadCount(data?.count ?? 0)
    } catch {
      // Ignore
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  useEffect(() => {
    const handler = () => fetchUnreadCount()
    window.addEventListener('message-notifier-update', handler)
    return () => window.removeEventListener('message-notifier-update', handler)
  }, [fetchUnreadCount])

  const visibleItems = navItems.filter((item) => item.roles.includes(role))

  const linkClass = ({ isActive }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    )

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:top-0 md:h-[calc(100vh-3.5rem)]',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col gap-2 py-4">
          <div className="flex h-10 items-center justify-between px-4 md:justify-start">
            <span className="text-sm font-medium text-muted-foreground">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Separator className="md:hidden" />
          <nav className="flex-1 space-y-1 px-2">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const showBadge = item.showUnreadBadge && unreadCount > 0
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={linkClass}
                  onClick={onClose}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                  {showBadge && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
