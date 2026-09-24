import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Shown after Stripe redirects the customer back.
 * On success, we call the backend to confirm the payment with Stripe and
 * mark the shipment paid (works alongside the webhook).
 */
export default function PaymentResult({ success }) {
  const [params] = useSearchParams()
  const shipmentId = params.get('shipmentId')
  const sessionId = params.get('session_id')
  const [confirming, setConfirming] = useState(success)

  useEffect(() => {
    if (success && shipmentId && sessionId) {
      axiosInstance
        .post(`/payments/confirm/${shipmentId}?sessionId=${sessionId}`)
        .catch(() => {})
        .finally(() => setConfirming(false))
    } else {
      setConfirming(false)
    }
  }, [success, shipmentId, sessionId])

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {success ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                Payment successful
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-destructive" />
                Payment cancelled
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {success
              ? 'Thank you! Your payment was received and the shipment will be marked as paid.'
              : 'Your payment was cancelled. You can try again from the shipment page.'}
          </p>
          <div className="flex gap-2">
            {shipmentId && (
              <Link to={`/shipments/${shipmentId}`}>
                <Button>Back to shipment</Button>
              </Link>
            )}
            <Link to="/shipments">
              <Button variant="outline">All shipments</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
