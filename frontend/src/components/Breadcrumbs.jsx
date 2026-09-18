import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const LABELS = {
  dashboard: 'Dashboard',
  shipments: 'Shipments',
  drivers: 'Drivers',
  customers: 'Customers',
  users: 'Users',
  messages: 'Messages',
}

export default function Breadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null

  const items = segments.map((segment, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/')
    const isLast = i === segments.length - 1
    const isId = /^\d+$/.test(segment)
    const displayLabel = isId ? `#${segment}` : (LABELS[segment] || segment.replace(/-/g, ' '))
    return { path, label: displayLabel, isLast }
  })

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={item.path} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-4 w-4 shrink-0" />}
          {item.isLast ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Link to={item.path} className="hover:text-foreground truncate max-w-[120px] sm:max-w-none">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
