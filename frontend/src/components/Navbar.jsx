import { Link } from 'react-router-dom'
import { Package, LogOut, LayoutDashboard, Menu } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const roleBadgeVariant = (role) => {
  if (role === 'ADMIN') return 'destructive'
  if (role === 'DRIVER') return 'success'
  return 'secondary' // CUSTOMER
}

export default function Navbar({ onMenuClick, className }) {
  const { user, logout } = useAuth()
  const initial = user?.username?.charAt(0)?.toUpperCase() || '?'

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4',
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Link
        to="/dashboard"
        className="flex items-center gap-2 font-semibold text-lg shrink-0"
      >
        <Package className="h-6 w-6 text-primary" />
        <span className="hidden sm:inline">ShipTrack</span>
      </Link>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <Badge variant={roleBadgeVariant(user?.role)} className="hidden sm:inline-flex">
          {user?.role}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {initial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
