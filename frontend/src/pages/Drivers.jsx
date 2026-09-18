import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
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

const DRIVER_STATUS_OPTIONS = ['AVAILABLE', 'BUSY', 'OFFLINE']

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editDriver, setEditDriver] = useState(null)
  const [deleteDriver, setDeleteDriver] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [updatingLocationId, setUpdatingLocationId] = useState(null)
  const [locationInput, setLocationInput] = useState({})
  const { toast } = useToast()

  const fetchDrivers = useCallback(() => {
    return axiosInstance.get('/drivers').then((res) => setDrivers(res.data || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchDrivers()
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load drivers')
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message })
      })
      .finally(() => setLoading(false))
  }, [fetchDrivers, toast])

  // Create form: user account + driver details
  const [createFullName, setCreateFullName] = useState('')
  const [createPhone, setCreatePhone] = useState('')
  const [createLicense, setCreateLicense] = useState('')
  const [createUsername, setCreateUsername] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const registerRes = await axiosInstance.post('/auth/register', {
        username: createUsername,
        email: createEmail,
        password: createPassword,
        role: 'DRIVER',
      })
      const userId = registerRes.data?.userId
      if (!userId) {
        throw new Error('Registration did not return user id')
      }
      await axiosInstance.post('/drivers', {
        userId,
        fullName: createFullName,
        phone: createPhone || null,
        licenseNumber: createLicense || null,
      })
      toast({ title: 'Driver created', description: `${createFullName} can now sign in` })
      setCreateOpen(false)
      setCreateFullName('')
      setCreatePhone('')
      setCreateLicense('')
      setCreateUsername('')
      setCreateEmail('')
      setCreatePassword('')
      fetchDrivers()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Create failed',
        description: err.response?.data?.message || err.message || 'Failed to create driver',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Edit form
  const [editFullName, setEditFullName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editLicense, setEditLicense] = useState('')
  const [editStatus, setEditStatus] = useState('')

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editDriver) return
    setSubmitting(true)
    try {
      await axiosInstance.put(`/drivers/${editDriver.id}`, {
        fullName: editFullName,
        phone: editPhone || null,
        licenseNumber: editLicense || null,
        status: editStatus || undefined,
      })
      toast({ title: 'Driver updated' })
      setEditDriver(null)
      fetchDrivers()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: err.response?.data?.message || 'Failed to update driver',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateLocation = async (driverId) => {
    const value = locationInput[driverId]?.trim()
    if (!value) return
    setUpdatingLocationId(driverId)
    try {
      await axiosInstance.put(`/drivers/${driverId}/location`, { currentLocation: value })
      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, currentLocation: value } : d))
      )
      setLocationInput((prev) => ({ ...prev, [driverId]: '' }))
      toast({ title: 'Location updated' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: err.response?.data?.message || 'Failed to update location',
      })
    } finally {
      setUpdatingLocationId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteDriver) return
    setSubmitting(true)
    try {
      await axiosInstance.delete(`/drivers/${deleteDriver.id}`)
      toast({ title: 'Driver deleted' })
      setDeleteDriver(null)
      fetchDrivers()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: err.response?.data?.message || 'Failed to delete driver',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
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
          <h1 className="text-2xl font-bold tracking-tight">Drivers</h1>
          <p className="text-muted-foreground text-sm">Manage drivers and their status</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New driver
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create driver</DialogTitle>
              <DialogDescription>
                Create a user account and link it as a driver. They can sign in with the credentials below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Account (login)</Label>
                <div className="grid gap-2">
                  <Input
                    placeholder="Username"
                    value={createUsername}
                    onChange={(e) => setCreateUsername(e.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Driver details</Label>
                <Input
                  placeholder="Full name"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  required
                />
                <Input
                  placeholder="Phone"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                />
                <Input
                  placeholder="License number"
                  value={createLicense}
                  onChange={(e) => setCreateLicense(e.target.value)}
                />
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
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All drivers</CardTitle>
          <CardDescription>{drivers.length} driver(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {drivers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No drivers yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Update location</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{d.phone || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{d.licenseNumber || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{d.currentLocation || '—'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        {d.status === 'AVAILABLE' && (
                          <span className="relative flex h-2 w-2" title="Live">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                          </span>
                        )}
                        <StatusBadge status={d.status} type="driver" />
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="New location"
                          value={locationInput[d.id] ?? ''}
                          onChange={(e) =>
                            setLocationInput((prev) => ({ ...prev, [d.id]: e.target.value }))
                          }
                          className="h-8 w-36"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateLocation(d.id)}
                          disabled={updatingLocationId === d.id || !locationInput[d.id]?.trim()}
                        >
                          {updatingLocationId === d.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Update'
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Dialog
                          open={editDriver?.id === d.id}
                          onOpenChange={(open) => {
                            if (!open) setEditDriver(null)
                            else {
                              setEditDriver(d)
                              setEditFullName(d.fullName)
                              setEditPhone(d.phone || '')
                              setEditLicense(d.licenseNumber || '')
                              setEditStatus(d.status || '')
                            }
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditDriver(d)
                              setEditFullName(d.fullName)
                              setEditPhone(d.phone || '')
                              setEditLicense(d.licenseNumber || '')
                              setEditStatus(d.status || '')
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit driver</DialogTitle>
                              <DialogDescription>Update driver details</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleEdit} className="space-y-4">
                              <div className="space-y-2">
                                <Label>Full name</Label>
                                <Input
                                  value={editFullName}
                                  onChange={(e) => setEditFullName(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                  value={editPhone}
                                  onChange={(e) => setEditPhone(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>License number</Label>
                                <Input
                                  value={editLicense}
                                  onChange={(e) => setEditLicense(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DRIVER_STATUS_OPTIONS.map((opt) => (
                                      <SelectItem key={opt} value={opt}>
                                        {opt}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <DialogFooter>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setEditDriver(null)}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                  Save
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog
                          open={deleteDriver?.id === d.id}
                          onOpenChange={(open) => !open && setDeleteDriver(null)}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteDriver(d)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete driver?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove driver {d.fullName}. Assigned shipments will be unassigned. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={submitting}
                              >
                                {submitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Delete'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
