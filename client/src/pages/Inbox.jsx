import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../layouts/AppLayout'
import UserLayout from '../layouts/UserLayout'
import api from '../services/api'

export default function Inbox() {
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('adminUser') || 'null')
  const isAdmin = !!localStorage.getItem('adminUser') || user?.role === 'admin'
  const Layout = isAdmin ? AppLayout : UserLayout

  const [conversations, setConversations] = useState([])
  const [staff, setStaff] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [unreadCounts, setUnreadCounts] = useState({})
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    loadConversations()
    loadContacts()
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

  const loadContacts = async () => {
    try {
      if (isAdmin) {
        // Admin wants to message customers (users)
        const res = await api.get('/admin/customers')
        setStaff(res.data.map(c => ({ user_id: c.user_id, full_name: c.full_name, role: c.role || 'user' })))
      } else {
        // User wants to message workshop staff (admins)
        const res = await api.get('/admin/staff')
        setStaff(res.data)
      }
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
      loadConversations() // Refresh conversations so new chats appear
    } catch (err) {
      toast.error('Failed to send message')
    }
  }

  // Dynamic Theme Styling
  const theme = {
    container: isAdmin ? 'bg-slate-900/50 backdrop-blur-xl border-white/5 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900',
    sidebarBorder: isAdmin ? 'border-white/5' : 'border-slate-200',
    emptyText: isAdmin ? 'text-slate-500' : 'text-slate-400',
    hoverBg: isAdmin ? 'hover:bg-white/5' : 'hover:bg-slate-50',
    avatarBg: isAdmin ? 'bg-gradient-to-br from-slate-700 to-slate-800' : 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700',
    chatAreaBg: isAdmin ? 'bg-slate-950/30' : 'bg-slate-50',
    headerBg: isAdmin ? 'bg-slate-900/20' : 'bg-white',
    activeChatAvatarBg: isAdmin ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950' : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white',
    msgUserBg: isAdmin ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white' : 'bg-blue-600 text-white',
    msgOtherBg: isAdmin ? 'bg-slate-800 text-slate-200 border-white/5' : 'bg-white text-slate-700 border-slate-200',
    inputBg: isAdmin ? 'bg-slate-800/50 border-white/5' : 'bg-white border-slate-200 text-slate-900',
    sendBtn: isAdmin ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
    activeStatus: isAdmin ? 'text-emerald-400' : 'text-emerald-600',
    selectedChatBg: isAdmin ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-blue-50 border-blue-200',
  }

  return (
    <Layout title="Messages">
      <div className={`rounded-2xl sm:rounded-[2.5rem] border overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-[70vh] ${theme.container}`}>
        {/* Contacts Sidebar - hidden on mobile when a chat is active */}
        <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-b md:border-b-0 md:border-r flex-col ${theme.sidebarBorder}`}>
          <div className={`p-6 border-b ${theme.sidebarBorder} ${theme.headerBg}`}>
            <h3 className="font-black text-xl tracking-tight">Chats</h3>
          </div>
          <div className={`flex-1 overflow-y-auto p-4 space-y-2 ${isAdmin ? '' : 'bg-white'}`}>
            {conversations.length === 0 ? (
              <div className="space-y-6 mt-6">
                <p className={`text-sm text-center ${theme.emptyText}`}>No active chats yet.</p>
                <div className="px-2">
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${theme.emptyText}`}>Start a chat</p>
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
                        className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border border-transparent ${theme.hoverBg}`}
                      >
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${theme.avatarBg}`}>
                          {s.full_name.charAt(0)}
                        </div>
                        <div className="text-left overflow-hidden">
                          <p className="font-bold text-sm truncate">{s.full_name}</p>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${theme.emptyText}`}>{s.role}</p>
                        </div>
                      </button>
                    ))}
                    {staff.length === 0 && (
                      <p className={`text-xs text-center ${theme.emptyText}`}>No workshop staff found yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              conversations.map((chat) => (
                <button
                  key={chat.other_id}
                  onClick={() => {
                    setActiveChat(chat)
                    setUnreadCounts(prev => ({ ...prev, [chat.other_id]: 0 }))
                  }}
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all relative ${
                    activeChat?.other_id === chat.other_id
                      ? theme.selectedChatBg
                      : `${theme.hoverBg} border border-transparent`
                  }`}
                >
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${theme.avatarBg}`}>
                    {chat.full_name.charAt(0)}
                  </div>
                  <div className="text-left overflow-hidden flex-1">
                    <p className="font-bold text-sm truncate">{chat.full_name}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme.emptyText}`}>{chat.role}</p>
                  </div>
                  {unreadCounts[chat.other_id] > 0 && (
                    <div className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-sm">
                      {unreadCounts[chat.other_id]}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area - hidden on mobile when no chat is active */}
        <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col ${theme.chatAreaBg}`}>
          {activeChat ? (
            <>
              <div className={`p-4 sm:p-6 border-b flex items-center gap-3 sm:gap-4 ${theme.sidebarBorder} ${theme.headerBg}`}>
                <button
                  onClick={() => setActiveChat(null)}
                  className={`md:hidden flex h-9 w-9 items-center justify-center rounded-xl border ${isAdmin ? 'border-white/10 text-slate-300 hover:bg-white/10' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                >
                  ←
                </button>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${theme.activeChatAvatarBg}`}>
                  {activeChat.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold">{activeChat.full_name}</h4>
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.activeStatus}`}>Active Now</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.message_id}
                    className={`flex ${msg.sender_id === user.user_id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-4 rounded-[1.5rem] text-sm font-medium shadow-sm border ${
                        msg.sender_id === user.user_id
                          ? `${theme.msgUserBg} rounded-tr-none border-transparent`
                          : `${theme.msgOtherBg} rounded-tl-none`
                      }`}
                    >
                      {msg.content}
                      <p className={`text-[8px] mt-2 opacity-50 ${msg.sender_id === user.user_id ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className={`max-w-[70%] p-4 rounded-[1.5rem] rounded-tl-none text-sm font-medium shadow-sm border flex items-center gap-1 ${theme.msgOtherBg}`}>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className={`p-6 border-t flex gap-4 ${theme.sidebarBorder} ${theme.headerBg}`}>
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className={`flex-1 border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium ${theme.inputBg}`}
                />
                <button className={`h-14 w-14 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-all hover:scale-105 active:scale-95 ${theme.sendBtn}`}>
                  🚀
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className={`h-24 w-24 rounded-[2rem] flex items-center justify-center text-4xl mb-6 shadow-sm border ${isAdmin ? 'bg-slate-900 border-white/5 shadow-2xl' : 'bg-white border-slate-200'}`}>
                💬
              </div>
              <h3 className="text-2xl font-black mb-2">Your Inbox</h3>
              <p className={`max-w-xs ${theme.emptyText}`}>Select a conversation to start talking with your mechanic or customer.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
