import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

const MAX_CONTENT_LENGTH = 1000

export default function NewMessageDialog({ open, onOpenChange, onSuccess }) {
  const [receivers, setReceivers] = useState([])
  const [receiverId, setReceiverId] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setLoading(true)
      axiosInstance
        .get('/messages/receivers')
        .then(({ data }) => setReceivers(data || []))
        .catch(() => toast({ variant: 'destructive', title: 'Failed to load receivers' }))
        .finally(() => setLoading(false))
    } else {
      setReceiverId('')
      setSubject('')
      setContent('')
    }
  }, [open, toast])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!receiverId || !content.trim()) return
    setSubmitting(true)
    try {
      await axiosInstance.post('/messages', {
        receiverId: Number(receiverId),
        subject: subject.trim() || undefined,
        content: content.trim(),
      })
      toast({ title: 'Message sent!' })
      onSuccess?.()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to send',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>Send a message to another user</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>To</Label>
            <Select value={receiverId} onValueChange={setReceiverId} required disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? 'Loading...' : 'Select recipient'} />
              </SelectTrigger>
              <SelectContent>
                {receivers.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.username}{r.role ? ` (${r.role})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject (optional)</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value.slice(0, 200))}
              placeholder="Subject"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
              placeholder="Type your message..."
              rows={5}
              maxLength={MAX_CONTENT_LENGTH}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">{content.length}/{MAX_CONTENT_LENGTH}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !receiverId || !content.trim()}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
