import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2, Play, Square } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../auth/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

export default function DriverLocation() {
  const { userId } = useAuth()
  const { toast } = useToast()
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sharing, setSharing] = useState(false)
  const [lastPosition, setLastPosition] = useState(null)
  const watchIdRef = useRef(null)

  // Find this user's driver profile
  useEffect(() => {
    if (!userId) return
    axiosInstance
      .get('/drivers')
      .then((res) => {
        const mine = (res.data || []).find((d) => d.userId === userId)
        if (!mine) {
          setError('No driver profile is linked to your account. Ask an admin to create one.')
        } else {
          setDriver(mine)
          if (mine.latitude != null && mine.longitude != null) {
            setLastPosition({ lat: mine.latitude, lng: mine.longitude, at: mine.locationUpdatedAt })
          }
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load driver profile'))
      .finally(() => setLoading(false))
  }, [userId])

  const sendPosition = useCallback(
    (lat, lng) => {
      if (!driver) return
      axiosInstance
        .put(`/drivers/${driver.id}/gps`, { latitude: lat, longitude: lng })
        .then(() => setLastPosition({ lat, lng, at: new Date().toISOString() }))
        .catch((err) =>
          toast({
            variant: 'destructive',
            title: 'Failed to send location',
            description: err.response?.data?.message || 'Request failed',
          })
        )
    },
    [driver, toast]
  )

  const startSharing = () => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Not supported', description: 'Geolocation is not available in this browser.' })
      return
    }
    // watchPosition fires whenever the device's location changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => sendPosition(pos.coords.latitude, pos.coords.longitude),
      (err) =>
        toast({
          variant: 'destructive',
          title: 'Location error',
          description: err.message || 'Could not get your location. Allow location access.',
        }),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    )
    setSharing(true)
  }

  const stopSharing = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setSharing(false)
  }, [])

  // Clean up the watcher if the page unmounts
  useEffect(() => () => stopSharing(), [stopSharing])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MapPin className="h-6 w-6" />
          Share my location
        </h1>
        <p className="text-muted-foreground text-sm">
          Broadcast your live GPS position so customers can track their shipments.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {driver && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live GPS</span>
              {sharing ? (
                <Badge variant="success" className="gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                  Sharing
                </Badge>
              ) : (
                <Badge variant="outline">Stopped</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Your browser reads your device's GPS and sends it to the server as you move.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {!sharing ? (
                <Button onClick={startSharing}>
                  <Play className="h-4 w-4 mr-2" />
                  Start sharing
                </Button>
              ) : (
                <Button variant="destructive" onClick={stopSharing}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop sharing
                </Button>
              )}
            </div>

            {lastPosition && (
              <div className="text-sm text-muted-foreground">
                <p>
                  Last sent: <span className="font-medium text-foreground">
                    {lastPosition.lat.toFixed(5)}, {lastPosition.lng.toFixed(5)}
                  </span>
                </p>
                {lastPosition.at && (
                  <p>At: {new Date(lastPosition.at).toLocaleTimeString()}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
