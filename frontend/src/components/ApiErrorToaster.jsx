import { useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'

export const API_ERROR_EVENT = 'api-error'

export default function ApiErrorToaster() {
  const { toast } = useToast()

  useEffect(() => {
    const handler = (e) => {
      const message = e.detail?.message || 'Something went wrong'
      toast({ variant: 'destructive', title: 'Error', description: message })
    }
    window.addEventListener(API_ERROR_EVENT, handler)
    return () => window.removeEventListener(API_ERROR_EVENT, handler)
  }, [toast])

  return null
}
