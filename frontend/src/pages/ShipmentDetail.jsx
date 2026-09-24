import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Truck,
  Pencil,
  Loader2,
  Package,
  MapPin,
  ListOrdered,
  CreditCard,
} from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import StatusBadge from '../components/StatusBadge'
import TrackingMap from '../components/TrackingMap'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

const STATUS_OPTIONS = [
  'ORDER_PLACED',
  'PROCESSING',
  'PACKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'EXCEPTION',
]

async function geocode(place) {
  if (!place || !String(place).trim()) return null
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`,
    { headers: { Accept: 'application/json', 'User-Agent': 'ShipTrack/1.0' } }
  )
  const data = await res.json()
  if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  return null
}

export default function ShipmentDetail() {
  const { id } = useParams()
  const [shipment, setShipment] = useState(null)
  const [packages, setPackages] = useState([])
  const [drivers, setDrivers] = useState([])
  const [driverDetail, setDriverDetail] = useState(null)
  const [customerDetail, setCustomerDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assignOpen, setAssignOpen] = useState(false)
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false)
  const [assignDriverId, setAssignDriverId] = useState('')
  const [updateStatus, setUpdateStatus] = useState('')
  const [updateLocation, setUpdateLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [paying, setPaying] = useState(false)
  const [mapMarkers, setMapMarkers] = useState([])
  const [driverGps, setDriverGps] = useState(null)
  const { toast } = useToast()

  const fetchShipment = useCallback(() => {
    return axiosInstance.get(`/shipments/id/${id}`).then((res) => res.data)
  }, [id])

  const fetchPackages = useCallback(() => {
    return axiosInstance.get(`/packages/shipment/${id}`).then((res) => res.data || [])
  }, [id])

  const fetchDrivers = useCallback(() => {
    return axiosInstance.get('/drivers').then((res) => res.data || [])
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [s, pkgList, driverList] = await Promise.all([
        fetchShipment(),
        fetchPackages(),
        fetchDrivers(),
      ])
      setShipment(s)
      setPackages(pkgList)
      setDrivers(driverList)
      if (s?.driverId) {
        axiosInstance.get(`/drivers/${s.driverId}`).then((r) => setDriverDetail(r.data)).catch(() => setDriverDetail(null))
      } else {
        setDriverDetail(null)
      }
      if (s?.customerId) {
        axiosInstance.get(`/customers/${s.customerId}`).then((r) => setCustomerDetail(r.data)).catch(() => setCustomerDetail(null))
      } else {
        setCustomerDetail(null)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Shipment not found')
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to load' })
    } finally {
      setLoading(false)
    }
  }, [id, fetchShipment, fetchPackages, fetchDrivers, toast])

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id, loadData])

  // Poll the assigned driver's live GPS every 5s
  useEffect(() => {
    if (!shipment?.driverId) {
      setDriverGps(null)
      return
    }
    let cancelled = false
    const poll = () => {
      axiosInstance
        .get(`/drivers/${shipment.driverId}`)
        .then((r) => {
          if (cancelled) return
          const d = r.data
          if (d?.latitude != null && d?.longitude != null) {
            setDriverGps({ lat: d.latitude, lng: d.longitude, at: d.locationUpdatedAt })
          }
        })
        .catch(() => {})
    }
    poll()
    const interval = setInterval(poll, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [shipment?.driverId])

  // Build tracking-map markers (driver GPS wins over geocoded text location)
  useEffect(() => {
    if (!shipment) {
      setMapMarkers([])
      return
    }
    const currentAddr = shipment.currentLocation || driverDetail?.currentLocation
    const promises = []
    const labels = []
    if (shipment.origin) {
      promises.push(geocode(shipment.origin))
      labels.push(`Origin: ${shipment.origin}`)
    }
    if (shipment.destination) {
      promises.push(geocode(shipment.destination))
      labels.push(`Destination: ${shipment.destination}`)
    }
    // Only geocode the text location if we don't have live GPS coordinates
    if (!driverGps && currentAddr) {
      promises.push(geocode(currentAddr))
      labels.push(`Current: ${currentAddr}`)
    }
    let cancelled = false
    Promise.all(promises).then((results) => {
      if (cancelled) return
      const markers = results
        .map((c, i) => (c ? { ...c, label: labels[i] } : null))
        .filter(Boolean)
      if (driverGps) {
        markers.push({ lat: driverGps.lat, lng: driverGps.lng, label: 'Driver (live GPS)' })
      }
      setMapMarkers(markers)
    })
    return () => { cancelled = true }
  }, [shipment?.origin, shipment?.destination, shipment?.currentLocation, driverDetail?.currentLocation, driverGps])

  const handleAssignDriver = async (e) => {
    e.preventDefault()
    if (!assignDriverId) return
    setSubmitting(true)
    try {
      await axiosInstance.put(`/shipments/${id}/assign-driver`, { driverId: Number(assignDriverId) })
      toast({ title: 'Driver assigned' })
      setAssignOpen(false)
      setAssignDriverId(shipment?.driverId ? String(shipment.driverId) : '')
      await loadData()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to assign driver' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await axiosInstance.put(`/shipments/${id}/status`, {
        status: updateStatus,
        currentLocation: updateLocation || undefined,
      })
      toast({ title: 'Status updated' })
      setUpdateStatusOpen(false)
      setUpdateStatus(shipment?.status || '')
      setUpdateLocation(shipment?.currentLocation || '')
      await loadData()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to update status' })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePay = async () => {
    setPaying(true)
    try {
      // Ask the backend to create a Stripe Checkout session, then send the
      // browser to Stripe's hosted payment page.
      const { data } = await axiosInstance.post(`/payments/checkout/${id}`)
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Payment error', description: err.response?.data?.message || 'Could not start payment' })
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !shipment) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Shipment not found'}</AlertDescription>
        </Alert>
        <Link to="/shipments">
          <Button variant="outline">← Back to Shipments</Button>
        </Link>
      </div>
    )
  }

  const currentAddr = shipment.currentLocation || driverDetail?.currentLocation

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/shipments" className="text-sm text-muted-foreground hover:text-foreground inline-block mb-1">
            ← Back to Shipments
          </Link>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {shipment.trackingNumber}
            <StatusBadge status={shipment.status} type="shipment" />
          </h1>
          <p className="text-muted-foreground text-sm">Shipment details, packages, and tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setAssignOpen(true); setAssignDriverId(shipment.driverId ? String(shipment.driverId) : '') }}>
            <Truck className="h-4 w-4 mr-2" />
            Assign driver
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setUpdateStatusOpen(true); setUpdateStatus(shipment.status); setUpdateLocation(shipment.currentLocation || '') }}>
            <Pencil className="h-4 w-4 mr-2" />
            Update status
          </Button>
          {shipment.paid ? (
            <span className="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-sm font-medium text-green-700">
              <CreditCard className="h-4 w-4 mr-2" />
              Paid
            </span>
          ) : (
            <Button size="sm" onClick={handlePay} disabled={paying}>
              {paying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
              Pay
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Packages
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipment info</CardTitle>
              <CardDescription>Origin, destination, status, and assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Origin</Label>
                  <p className="font-medium">{shipment.origin}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Destination</Label>
                  <p className="font-medium">{shipment.destination}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estimated delivery</Label>
                  <p className="font-medium">{shipment.estimatedDelivery || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Current location</Label>
                  <p className="font-medium">{currentAddr || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Driver</Label>
                  <p className="font-medium">{driverDetail?.fullName || (shipment.driverId ? `#${shipment.driverId}` : '—')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{customerDetail?.fullName || (shipment.customerId ? `#${shipment.customerId}` : '—')}</p>
                </div>
                {shipment.assignedAt && (
                  <div>
                    <Label className="text-muted-foreground">Assigned at</Label>
                    <p className="font-medium">{new Date(shipment.assignedAt).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">{shipment.createdAt ? new Date(shipment.createdAt).toLocaleString() : '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Packages</CardTitle>
              <CardDescription>{packages.length} package(s) in this shipment</CardDescription>
            </CardHeader>
            <CardContent>
              {packages.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No packages.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Weight (kg)</TableHead>
                      <TableHead>Dimensions (cm)</TableHead>
                      <TableHead>Fragile</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.description || '—'}</TableCell>
                        <TableCell>{p.weightKg != null ? p.weightKg : '—'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {[p.widthCm, p.heightCm, p.depthCm].some((v) => v != null)
                            ? `${p.widthCm ?? '—'} × ${p.heightCm ?? '—'} × ${p.depthCm ?? '—'}`
                            : '—'}
                        </TableCell>
                        <TableCell>{p.fragile ? 'Yes' : 'No'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Map</CardTitle>
              <CardDescription>Origin, destination, and current location</CardDescription>
            </CardHeader>
            <CardContent>
              <TrackingMap markers={mapMarkers} className="h-[400px] w-full" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign driver</DialogTitle>
            <DialogDescription>Select a driver for this shipment.</DialogDescription>
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
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.fullName} {d.status ? `(${d.status})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Assign
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={updateStatusOpen} onOpenChange={setUpdateStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update status</DialogTitle>
            <DialogDescription>Change status and optional current location.</DialogDescription>
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
              <Button type="button" variant="outline" onClick={() => setUpdateStatusOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
