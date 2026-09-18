import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Truck,
  Trash2,
  ArrowUpRight,
  Loader2,
  UserCircle,
} from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import StatusBadge from '../components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '../auth/AuthContext'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  'ORDER_PLACED',
  'PROCESSING',
  'PACKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'EXCEPTION',
]

export default function Shipments() {
  const [searchParams] = useSearchParams()
  const customerIdFromUrl = searchParams.get('customerId')
  const [shipments, setShipments] = useState([])
  const [drivers, setDrivers] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [trackingSearch, setTrackingSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [updateStatusShipment, setUpdateStatusShipment] = useState(null)
  const [assignDriverShipment, setAssignDriverShipment] = useState(null)
  const [assignCustomerShipment, setAssignCustomerShipment] = useState(null)
  const [deleteShipment, setDeleteShipment] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const fetchShipments = useCallback((params = {}) => {
    const query = new URLSearchParams()
    if (params.customerId != null && params.customerId !== '') query.set('customerId', params.customerId)
    if (params.status != null && params.status !== '') query.set('status', params.status)
    const qs = query.toString()
    return axiosInstance.get('/shipments' + (qs ? `?${qs}` : '')).then((res) => setShipments(res.data || []))
  }, [])
  const fetchDrivers = useCallback(() => {
    return axiosInstance.get('/drivers').then((res) => setDrivers(res.data || []))
  }, [])
  const fetchCustomers = useCallback(() => {
    return axiosInstance.get('/customers').then((res) => setCustomers(res.data || []))
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const promises = [
        fetchShipments({ customerId: customerIdFromUrl || undefined, status: statusFilter || undefined }),
      ]
      if (isAdmin) {
        promises.push(fetchDrivers(), fetchCustomers())
      }
      await Promise.all(promises)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data')
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to load' })
    } finally {
      setLoading(false)
    }
  }, [fetchShipments, fetchDrivers, fetchCustomers, toast, customerIdFromUrl, statusFilter, isAdmin])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = shipments.filter((s) => {
    if (trackingSearch.trim() && !s.trackingNumber?.toLowerCase().includes(trackingSearch.trim().toLowerCase())) return false
    return true
  })

  const driverById = (id) => drivers.find((d) => d.id === id)
  const customerById = (id) => customers.find((c) => c.id === id)

  // Create form state
  const [createOrigin, setCreateOrigin] = useState('')
  const [createDestination, setCreateDestination] = useState('')
  const [createEstimatedDelivery, setCreateEstimatedDelivery] = useState('')
  const [createWeight, setCreateWeight] = useState('')
  const [createWidth, setCreateWidth] = useState('')
  const [createHeight, setCreateHeight] = useState('')
  const [createDepth, setCreateDepth] = useState('')
  const [createFragile, setCreateFragile] = useState(false)
  const [createCustomerId, setCreateCustomerId] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data: shipment } = await axiosInstance.post('/shipments', {
        origin: createOrigin,
        destination: createDestination,
        estimatedDelivery: createEstimatedDelivery?.trim() || 'TBD',
        ...(createCustomerId ? { customerId: Number(createCustomerId) } : {}),
      })
      if (createWeight || createWidth || createHeight || createDepth || createFragile) {
        await axiosInstance.post('/packages', {
          shipmentId: shipment.id,
          weightKg: createWeight ? Number(createWeight) : null,
          widthCm: createWidth ? Number(createWidth) : null,
          heightCm: createHeight ? Number(createHeight) : null,
          depthCm: createDepth ? Number(createDepth) : null,
          fragile: createFragile,
        })
      }
      toast({ title: 'Shipment created', description: `Tracking: ${shipment.trackingNumber}` })
      setCreateOpen(false)
      resetCreateForm()
      fetchShipments({ customerId: customerIdFromUrl || undefined, status: statusFilter || undefined })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Create failed',
        description: err.response?.data?.message || 'Failed to create shipment',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetCreateForm = () => {
    setCreateOrigin('')
    setCreateDestination('')
    setCreateEstimatedDelivery('')
    setCreateCustomerId('')
    setCreateWeight('')
    setCreateWidth('')
    setCreateHeight('')
    setCreateDepth('')
    setCreateFragile(false)
  }

  // Update status form
  const [updateStatus, setUpdateStatus] = useState('')
  const [updateLocation, setUpdateLocation] = useState('')

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    if (!updateStatusShipment) return
    setSubmitting(true)
    try {
      await axiosInstance.put(`/shipments/${updateStatusShipment.id}/status`, {
        status: updateStatus,
        currentLocation: updateLocation || undefined,
      })
      toast({ title: 'Status updated' })
      setUpdateStatusShipment(null)
      setUpdateStatus('')
      setUpdateLocation('')
      fetchShipments({ customerId: customerIdFromUrl || undefined, status: statusFilter || undefined })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: err.response?.data?.message || 'Failed to update status',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Assign driver form
  const [assignDriverId, setAssignDriverId] = useState('')
  const [assignCustomerId, setAssignCustomerId] = useState('')

  const handleAssignDriver = async (e) => {
    e.preventDefault()
    if (!assignDriverShipment || !assignDriverId) return
    setSubmitting(true)
    try {
      await axiosInstance.put(`/shipments/${assignDriverShipment.id}/assign-driver`, {
        driverId: Number(assignDriverId),
      })
      toast({ title: 'Driver assigned' })
      setAssignDriverShipment(null)
      setAssignDriverId('')
      fetchShipments({ customerId: customerIdFromUrl || undefined, status: statusFilter || undefined })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Assign failed',
        description: err.response?.data?.message || 'Failed to assign driver',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssignCustomer = async (e) => {
    e.preventDefault()
    if (!assignCustomerShipment || !assignCustomerId) return
    setSubmitting(true)
    try {
      await axiosInstance.put(`/shipments/${assignCustomerShipment.id}/assign-customer`, {
        customerId: Number(assignCustomerId),
      })
      toast({ title: 'Customer assigned' })
      setAssignCustomerShipment(null)
      setAssignCustomerId('')
      fetchShipments({ customerId: customerIdFromUrl || undefined, status: statusFilter || undefined })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Assign failed',
        description: err.response?.data?.message || 'Failed to assign customer',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteShipment) return
    setSubmitting(true)
    try {
      await axiosInstance.delete(`/shipments/${deleteShipment.id}`)
      toast({ title: 'Shipment deleted' })
      setDeleteShipment(null)
      fetchShipments({ customerId: customerIdFromUrl || undefined, status: statusFilter || undefined })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: err.response?.data?.message || 'Failed to delete shipment',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <h1 className="text-2xl font-bold tracking-tight">Shipments</h1>
          <p className="text-muted-foreground text-sm">Manage all shipments</p>
        </div>
        {isAdmin && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New shipment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create shipment</DialogTitle>
              <DialogDescription>Add a new shipment. Optionally add package details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  value={createOrigin}
                  onChange={(e) => setCreateOrigin(e.target.value)}
                  placeholder="e.g. New York, NY"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={createDestination}
                  onChange={(e) => setCreateDestination(e.target.value)}
                  placeholder="e.g. Los Angeles, CA"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedDelivery">Estimated delivery</Label>
                <Input
                  id="estimatedDelivery"
                  type="date"
                  value={createEstimatedDelivery}
                  onChange={(e) => setCreateEstimatedDelivery(e.target.value)}
                  placeholder="Date or text"
                />
              </div>
              <div className="space-y-2">
                <Label>Customer (optional)</Label>
                <Select value={createCustomerId || 'none'} onValueChange={(v) => setCreateCustomerId(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.fullName}{c.email ? ` (${c.email})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Package (optional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={createWeight}
                      onChange={(e) => setCreateWeight(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (cm)</Label>
                    <Input
                      id="width"
                      type="number"
                      step="0.1"
                      value={createWidth}
                      onChange={(e) => setCreateWidth(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      value={createHeight}
                      onChange={(e) => setCreateHeight(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depth">Depth (cm)</Label>
                    <Input
                      id="depth"
                      type="number"
                      step="0.1"
                      value={createDepth}
                      onChange={(e) => setCreateDepth(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="fragile"
                    checked={createFragile}
                    onChange={(e) => setCreateFragile(e.target.checked)}
                    className="rounded border-input"
                  />
                  <Label htmlFor="fragile">Fragile</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="text-sm whitespace-nowrap">Status</Label>
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
            <SelectTrigger id="status-filter" className="w-[180px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="tracking-search" className="text-sm whitespace-nowrap">Tracking</Label>
          <Input
            id="tracking-search"
            placeholder="Search by tracking number"
            value={trackingSearch}
            onChange={(e) => setTrackingSearch(e.target.value)}
            className="w-[200px]"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All shipments</CardTitle>
          <CardDescription>{filtered.length} shipment(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No shipments match your filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Origin → Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const driver = s.driverId ? driverById(s.driverId) : null
                  const customer = s.customerId ? customerById(s.customerId) : null
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.trackingNumber}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.origin} → {s.destination}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} type="shipment" />
                      </TableCell>
                      <TableCell>{driver ? driver.fullName : '—'}</TableCell>
                      <TableCell>{customer ? customer.fullName : (s.customerId ? `#${s.customerId}` : '—')}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link to={`/shipments/${s.id}`}>
                            <Button variant="ghost" size="sm">
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Dialog open={updateStatusShipment?.id === s.id} onOpenChange={(open) => !open && setUpdateStatusShipment(null)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUpdateStatusShipment(s)
                                setUpdateStatus(s.status)
                                setUpdateLocation(s.currentLocation || '')
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update status</DialogTitle>
                                <DialogDescription>Change status and optional location for {s.trackingNumber}</DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleUpdateStatus} className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Status</Label>
                                  <Select value={updateStatus} onValueChange={setUpdateStatus} required>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {STATUS_OPTIONS.map((opt) => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="currentLocation">Current location</Label>
                                  <Input
                                    id="currentLocation"
                                    value={updateLocation}
                                    onChange={(e) => setUpdateLocation(e.target.value)}
                                    placeholder="Optional"
                                  />
                                </div>
                                <DialogFooter>
                                  <Button type="button" variant="outline" onClick={() => setUpdateStatusShipment(null)}>Cancel</Button>
                                  <Button type="submit" disabled={submitting}>
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Save
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={assignDriverShipment?.id === s.id} onOpenChange={(open) => !open && setAssignDriverShipment(null)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAssignDriverShipment(s)
                                setAssignDriverId(s.driverId ? String(s.driverId) : '')
                              }}
                            >
                              <Truck className="h-4 w-4" />
                            </Button>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign driver</DialogTitle>
                                <DialogDescription>Select a driver for {s.trackingNumber}</DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleAssignDriver} className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Driver</Label>
                                  <Select value={assignDriverId} onValueChange={setAssignDriverId} required>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select driver" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {drivers.map((d) => (
                                        <SelectItem key={d.id} value={String(d.id)}>{d.fullName} {d.status ? `(${d.status})` : ''}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <DialogFooter>
                                  <Button type="button" variant="outline" onClick={() => setAssignDriverShipment(null)}>Cancel</Button>
                                  <Button type="submit" disabled={submitting}>
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Assign
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={assignCustomerShipment?.id === s.id} onOpenChange={(open) => !open && setAssignCustomerShipment(null)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAssignCustomerShipment(s)
                                setAssignCustomerId(s.customerId ? String(s.customerId) : '')
                              }}
                              title="Assign customer"
                            >
                              <UserCircle className="h-4 w-4" />
                            </Button>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign customer</DialogTitle>
                                <DialogDescription>Select a customer for {s.trackingNumber}</DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleAssignCustomer} className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Customer</Label>
                                  <Select value={assignCustomerId} onValueChange={setAssignCustomerId} required>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {customers.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.fullName}{c.email ? ` (${c.email})` : ''}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <DialogFooter>
                                  <Button type="button" variant="outline" onClick={() => setAssignCustomerShipment(null)}>Cancel</Button>
                                  <Button type="submit" disabled={submitting || !assignCustomerId}>
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Assign
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog open={deleteShipment?.id === s.id} onOpenChange={(open) => !open && setDeleteShipment(null)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteShipment(s)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete shipment?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete shipment {s.trackingNumber}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={submitting}>
                                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
