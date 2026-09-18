import { useState, useEffect, useCallback } from 'react'
import { MessageCircle, Loader2, Send, RefreshCw } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import NewMessageDialog from '../components/NewMessageDialog'

const MAX_CONTENT_LENGTH = 1000

export default function Messages() {
  const { user, userId } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedOther, setSelectedOther] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessageContent, setNewMessageContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessageOpen, setNewMessageOpen] = useState(false)
  const { toast } = useToast()

  const fetchInbox = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/messages/inbox')
      setConversations(data || [])
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load inbox',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchConversation = useCallback(async (otherUserId) => {
    if (!otherUserId) {
      setMessages([])
      return
    }
    try {
      const { data } = await axiosInstance.get(`/messages/conversation/${otherUserId}`)
      setMessages(data || [])
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load conversation',
      })
    }
  }, [toast])

  useEffect(() => {
    fetchInbox()
  }, [fetchInbox])

  useEffect(() => {
    if (selectedOther) {
      fetchConversation(selectedOther.otherUserId)
    } else {
      setMessages([])
    }
  }, [selectedOther, fetchConversation])

  // Poll for new messages (replaces the old WebSocket live updates)
  useEffect(() => {
    if (!userId) return
    const interval = setInterval(() => {
      fetchInbox()
      if (selectedOther) {
        fetchConversation(selectedOther.otherUserId)
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [userId, fetchInbox, fetchConversation, selectedOther])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!selectedOther || !newMessageContent.trim()) return
    setSending(true)
    try {
      await axiosInstance.post('/messages', {
        receiverId: selectedOther.otherUserId,
        content: newMessageContent.trim(),
      })
      setNewMessageContent('')
      fetchConversation(selectedOther.otherUserId)
      fetchInbox()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to send',
      })
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isFromMe = (msg) => msg.senderId === userId

  return (
    <div className="flex h-[calc(100vh-8rem)] border rounded-lg bg-background overflow-hidden">
      <div className="w-80 border-r flex flex-col shrink-0">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Messages</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setLoading(true); fetchInbox() }} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
            <Button size="sm" onClick={() => setNewMessageOpen(true)}>
              <MessageCircle className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.otherUserId}
                type="button"
                className={cn(
                  'w-full p-4 flex items-start gap-3 text-left hover:bg-muted/50 transition-colors border-b',
                  selectedOther?.otherUserId === conv.otherUserId && 'bg-muted'
                )}
                onClick={() => setSelectedOther(conv)}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(conv.otherUsername || '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{conv.otherUsername}</span>
                    {conv.otherRole && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {conv.otherRole}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage || '—'}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(conv.lastMessageAt)}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <Badge variant="destructive" className="shrink-0">
                    {conv.unreadCount}
                  </Badge>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedOther ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {(selectedOther.otherUsername || '?')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedOther.otherUsername}</p>
                {selectedOther.otherRole && (
                  <Badge variant="secondary" className="text-xs">{selectedOther.otherRole}</Badge>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    isFromMe(msg) ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[75%] rounded-lg px-4 py-2',
                      isFromMe(msg)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs opacity-80">{formatTime(msg.createdAt)}</span>
                      {isFromMe(msg) && (
                        <span className="text-xs">{msg.isRead ? '✓✓' : '✓'}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={newMessageContent}
                  onChange={(e) => setNewMessageContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
                  placeholder="Type a message..."
                  rows={2}
                  className="resize-none min-h-[60px]"
                  maxLength={MAX_CONTENT_LENGTH}
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || !newMessageContent.trim()} className="shrink-0">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {newMessageContent.length}/{MAX_CONTENT_LENGTH}
              </p>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a conversation or start a new one</p>
          </div>
        )}
      </div>

      <NewMessageDialog
        open={newMessageOpen}
        onOpenChange={setNewMessageOpen}
        onSuccess={() => {
          setNewMessageOpen(false)
          fetchInbox()
        }}
      />
    </div>
  )
}
