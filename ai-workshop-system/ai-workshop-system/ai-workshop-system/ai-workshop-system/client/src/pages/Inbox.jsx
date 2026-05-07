import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../layouts/AppLayout'
import api from '../services/api'

export default function Inbox() {
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('adminUser') || 'null')
  const [conversations, setConversations] = useState([])
  const [staff, setStaff] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    loadConversations()
    loadStaff()
  }, [])

  useEffect(() => {
    if (activeChat) {
      loadMessages()
      const interval = setInterval(loadMessages, 3000) // Poll for new messages
      return () => clearInterval(interval)
    }
  }, [activeChat])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadConversations = async () => {
    try {
      const res = await api.get(`/messages/conversations/${user.user_id}`)
      setConversations(res.data)
    } catch (err) {
      console.error('Failed to load conversations')
    }
  }

  const loadStaff = async () => {
    try {
      const res = await api.get('/admin/staff')
      setStaff(res.data)
    } catch (err) {
      setStaff([])
    }
  }

  const loadMessages = async () => {
    if (!activeChat) return
    try {
      const res = await api.get(`/messages/${user.user_id}/${activeChat.other_id}`)
      setMessages(res.data)
    } catch (err) {
      console.error('Failed to load messages')
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChat) return

    try {
      await api.post('/messages', {
        sender_id: user.user_id,
        receiver_id: activeChat.other_id,
        content: newMessage
      })
      setNewMessage('')
      loadMessages()
    } catch (err) {
      toast.error('Failed to send message')
    }
  }

  return (
    <AppLayout title="Messages">
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden flex h-[70vh] shadow-2xl">
        {/* Contacts Sidebar */}
        <div className="w-80 border-r border-white/5 flex flex-col">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-black text-xl tracking-tight">Chats</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {conversations.length === 0 ? (
              <div className="space-y-6 mt-6">
                <p className="text-slate-500 text-sm text-center">No active chats yet.</p>
                <div className="px-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Start a chat</p>
                  <div className="space-y-2">
                    {staff.map((s) => (
                      <button
                        key={s.user_id}
                        onClick={() =>
                          setActiveChat({
                            other_id: s.user_id,
                            full_name: s.full_name,
                            role: s.role,
                          })
                        }
                        className="w-full p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-white/5 border border-transparent"
                      >
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-lg">
                          {s.full_name.charAt(0)}
                        </div>
                        <div className="text-left overflow-hidden">
                          <p className="font-bold text-sm truncate">{s.full_name}</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{s.role}</p>
                        </div>
                      </button>
                    ))}
                    {staff.length === 0 && (
                      <p className="text-slate-600 text-xs text-center">No workshop staff found yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              conversations.map((chat) => (
                <button
                  key={chat.other_id}
                  onClick={() => setActiveChat(chat)}
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                    activeChat?.other_id === chat.other_id
                      ? 'bg-cyan-500/10 border border-cyan-500/20'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-lg">
                    {chat.full_name.charAt(0)}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="font-bold text-sm truncate">{chat.full_name}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{chat.role}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-950/30">
          {activeChat ? (
            <>
              <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-slate-900/20">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-slate-950">
                  {activeChat.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold">{activeChat.full_name}</h4>
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em]">Active Now</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.message_id}
                    className={`flex ${msg.sender_id === user.user_id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-4 rounded-[1.5rem] text-sm font-medium shadow-lg ${
                        msg.sender_id === user.user_id
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                      }`}
                    >
                      {msg.content}
                      <p className={`text-[8px] mt-2 opacity-50 ${msg.sender_id === user.user_id ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-6 bg-slate-900/20 border-t border-white/5 flex gap-4">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium"
                />
                <button className="h-14 w-14 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95">
                  🚀
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="h-24 w-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-4xl mb-6 shadow-2xl border border-white/5">
                💬
              </div>
              <h3 className="text-2xl font-black mb-2">Your Inbox</h3>
              <p className="text-slate-500 max-w-xs">Select a conversation to start talking with your mechanic or customer.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
