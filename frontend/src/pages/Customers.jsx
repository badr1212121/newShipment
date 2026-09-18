import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Package, Loader2 } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
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

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)
  const [deleteCustomer, setDeleteCustomer] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchCustomers = useCallback(() => {
    return axiosInstance.get('/customers').then((res) => setCustomers(res.data || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchCustomers()
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load customers')
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message })
      })
      .finally(() => setLoading(false))
  }, [fetchCustomers, toast])

  // Create: user account + customer details
  const [createFullName, setCreateFullName] = useState('')
  const [createPhone, setCreatePhone] = useState('')
  const [createAddress, setCreateAddress] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const registerRes = await axiosInstance.post('/auth/register', {
        username: createEmail.split('@')[0] || createEmail,
        email: createEmail,
        password: createPassword,
        role: 'CUSTOMER',
      })
      const userId = registerRes.data?.userId
      if (!userId) throw new Error('Registration did not return user id')
      await axiosInstance.post('/customers', {
        userId,
        fullName: createFullName,
        phone: createPhone || null,
        address: createAddress || null,
      })
      toast({ title: 'Customer created', description: `${createFullName} can now sign in` })
      setCreateOpen(false)
      setCreateFullName('')
      setCreatePhone('')
      setCreateAddress('')
      setCreateEmail('')
      setCreatePassword('')
      fetchCustomers()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Create failed',
        description: err.response?.data?.message || err.message || 'Failed to create customer',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Edit form
  const [editFullName, setEditFullName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editCustomer) return
    setSubmitting(true)
    try {
      await axiosInstance.put(`/customers/${editCustomer.id}`, {
        fullName: editFullName,
        phone: editPhone || null,
        address: editAddress || null,
      })
      toast({ title: 'Customer updated' })
      setEditCustomer(null)
      fetchCustomers()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: err.response?.data?.message || 'Failed to update customer',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteCustomer) return
    setSubmitting(true)
    try {
      await axiosInstance.delete(`/customers/${deleteCustomer.id}`)
      toast({ title: 'Customer deleted' })
      setDeleteCustomer(null)
      fetchCustomers()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: err.response?.data?.message || 'Failed to delete customer',
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
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm">Manage customers and their shipments</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create customer</DialogTitle>
              <DialogDescription>
                Create a user account and link it as a customer. They can sign in with the credentials below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Account (login)</Label>
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
              <div className="space-y-2">
                <Label>Customer details</Label>
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
                  placeholder="Address"
                  value={createAddress}
                  onChange={(e) => setCreateAddress(e.target.value)}
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
          <CardTitle>All customers</CardTitle>
          <CardDescription>{customers.length} customer(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No customers yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Shipments</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone || '—'}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate" title={c.address}>
                      {c.address || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.email || '—'}</TableCell>
                    <TableCell>{c.shipmentsCount ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/shipments?customerId=${c.id}`}>
                            <Package className="h-4 w-4" title="View shipments" />
                          </Link>
                        </Button>
                        <Dialog
                          open={editCustomer?.id === c.id}
                          onOpenChange={(open) => {
                            if (!open) setEditCustomer(null)
                            else {
                              setEditCustomer(c)
                              setEditFullName(c.fullName)
                              setEditPhone(c.phone || '')
                              setEditAddress(c.address || '')
                            }
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditCustomer(c)
                              setEditFullName(c.fullName)
                              setEditPhone(c.phone || '')
                              setEditAddress(c.address || '')
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit customer</DialogTitle>
                              <DialogDescription>Update customer details</DialogDescription>
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
                                <Label>Address</Label>
                                <Input
                                  value={editAddress}
                                  onChange={(e) => setEditAddress(e.target.value)}
                                />
                              </div>
                              <DialogFooter>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setEditCustomer(null)}
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
                          open={deleteCustomer?.id === c.id}
                          onOpenChange={(open) => !open && setDeleteCustomer(null)}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteCustomer(c)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete customer?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove customer {c.fullName}. This action cannot be undone.
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
