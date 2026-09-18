import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  ArrowUpRight,
} from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import StatusBadge from '../components/StatusBadge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Dashboard() {
  const [shipments, setShipments] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setError('')
      const [shipRes, driverRes] = await Promise.all([
        axiosInstance.get('/shipments'),
        axiosInstance.get('/drivers'),
      ])
      setShipments(shipRes.data || [])
      setDrivers(driverRes.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalShipments = shipments.length
  const activeDrivers = drivers.filter((d) => d.status === 'AVAILABLE').length
  const pendingShipments = shipments.filter((s) => s.status !== 'DELIVERED').length
  const deliveredShipments = shipments.filter((s) => s.status === 'DELIVERED').length
  const recentShipments = shipments.slice(0, 10)

  const statCards = [
    {
      title: 'Total Shipments',
      value: totalShipments,
      icon: Package,
      description: 'All shipments',
    },
    {
      title: 'Active Drivers',
      value: activeDrivers,
      icon: Truck,
      description: 'Available now',
    },
    {
      title: 'Pending',
      value: pendingShipments,
      icon: Clock,
      description: 'In progress',
    },
    {
      title: 'Delivered',
      value: deliveredShipments,
      icon: CheckCircle,
      description: 'Completed',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Overview of shipments and drivers
          </p>
        </div>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Shipments</CardTitle>
          <CardDescription>Latest shipments across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {recentShipments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No shipments yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Origin → Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentShipments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.trackingNumber}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.origin} → {s.destination}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} type="shipment" />
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/shipments/${s.id}`}
                        className="inline-flex items-center text-primary hover:underline text-sm font-medium"
                      >
                        View
                        <ArrowUpRight className="h-4 w-4 ml-0.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
