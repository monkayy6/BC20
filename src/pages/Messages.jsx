import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs, where } from 'firebase/firestore'
import { db, auth } from '../firebase'

export default function Messages() {
  const [groupConversations, setGroupConversations] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [directConvos, setDirectConvos] = useState(() => {
    const saved = localStorage.getItem('directConvos')
    return saved ? JSON.parse(saved) : []
  })
  const [unreadCounts, setUnreadCounts] = useState({})
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!activeConvo) return
    const q = query(
      collection(db, 'conversations', activeConvo.id, 'messages'),
      orderBy('timestamp', 'asc')
    )
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [activeConvo])

  useEffect(() => {
    const unsubscribers = [...groupConversations, ...directConvos]
      .filter(c => c.id !== activeConvo?.id)
      .map(convo => {
        const q = query(
          collection(db, 'conversations', convo.id, 'messages'),
          orderBy('timestamp', 'asc')
        )
        return onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          const lastSeen = parseInt(localStorage.getItem(`lastSeen_${convo.id}`) || '0')
          const unread = msgs.filter(m => m.timestamp?.seconds * 1000 > lastSeen && m.sender !== auth.currentUser?.email).length
          setUnreadCounts(prev => ({ ...prev, [convo.id]: unread }))
        })
      })
    return () => unsubscribers.forEach(u => u())
  }, [activeConvo, directConvos, groupConversations])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return
    const q = query(collection(db, 'classes'), where('uid', '==', user.uid))
    const unsub = onSnapshot(q, (snapshot) => {
      const classes = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        type: 'group',
        initials: doc.data().name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      }))
      setGroupConversations(classes)
      if (classes.length > 0 && !activeConvo) {
        setActiveConvo(classes[0])
      }
    })
    return () => unsub()
  }, [])

  const searchUsers = async (queryText) => {
    setSearchQuery(queryText)
    if (!queryText.trim()) { setSearchResults([]); return }
    const snap = await getDocs(collection(db, 'users'))
    const currentEmail = auth.currentUser?.email
    const results = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(u => u.email !== currentEmail && (
        u.email?.toLowerCase().includes(queryText.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(queryText.toLowerCase())
      ))
    setSearchResults(results)
  }

  const startDirectMessage = (user) => {
    const currentEmail = auth.currentUser?.email
    const convoId = [currentEmail, user.email].sort().join('__').replace(/[@.]/g, '_')
    const newConvo = {
      id: convoId,
      name: user.displayName || user.email,
      type: 'direct',
      initials: (user.displayName || 'DM').slice(0, 2).toUpperCase()
    }
    setDirectConvos(prev => {
      if (prev.find(c => c.id === convoId)) return prev
      const updated = [...prev, newConvo]
      localStorage.setItem('directConvos', JSON.stringify(updated))
      return updated
    })
    openConvo(newConvo)
    setSearchQuery('')
    setSearchResults([])
  }

  const openConvo = (convo) => {
    localStorage.setItem(`lastSeen_${convo.id}`, Date.now().toString())
    setUnreadCounts(prev => ({ ...prev, [convo.id]: 0 }))
    setActiveConvo(convo)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvo) return
    const user = auth.currentUser
    await addDoc(collection(db, 'conversations', activeConvo.id, 'messages'), {
      text: newMessage.trim(),
      sender: user?.email || 'anonymous',
      senderName: user?.displayName || 'Student',
      timestamp: serverTimestamp(),
    })
    setNewMessage('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const currentUser = auth.currentUser?.email

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>

      <div style={{ width: '240px', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1E4D8C', margin: '0 0 10px' }}>Messages</h2>
          <div style={{ position: 'relative' }}>
            <input
              value={searchQuery}
              onChange={e => searchUsers(e.target.value)}
              placeholder="Search users..."
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #eee', fontSize: '12px', background: '#f9f9f9', outline: 'none', boxSizing: 'border-box', color: '#000000' }}
            />
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '36px', left: 0, right: 0, background: '#fff', border: '1px solid #eee', borderRadius: '8px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    onClick={() => startDirectMessage(user)}
                    style={{ padding: '10px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '500', color: '#0C447C', flexShrink: 0 }}>
                      {(user.displayName || user.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: '#333' }}>{user.displayName || user.email}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '8px', overflowY: 'auto', flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 8px 4px' }}>Groups</div>
          {groupConversations.map(convo => (
            <div key={convo.id} onClick={() => openConvo(convo)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', cursor: 'pointer', background: activeConvo?.id === convo.id ? '#E6F1FB' : 'transparent' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', color: '#0C447C', flexShrink: 0 }}>{convo.initials}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: activeConvo?.id === convo.id ? '#1E4D8C' : '#333' }}>{convo.name}</div>
                  {unreadCounts[convo.id] > 0 && (
                    <div style={{ background: '#1E4D8C', color: '#fff', fontSize: '9px', fontWeight: '500', borderRadius: '20px', padding: '1px 4px', minWidth: '14px', textAlign: 'center' }}>{unreadCounts[convo.id]}</div>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>Group chat</div>
              </div>
            </div>
          ))}

          {directConvos.length > 0 && (
            <>
              <div style={{ fontSize: '10px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 8px 4px' }}>Direct</div>
              {directConvos.map(convo => (
                <div key={convo.id} onClick={() => openConvo(convo)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', cursor: 'pointer', background: activeConvo?.id === convo.id ? '#E6F1FB' : 'transparent' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', color: '#3C3489', flexShrink: 0 }}>{convo.initials}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: activeConvo?.id === convo.id ? '#1E4D8C' : '#333' }}>{convo.name}</div>
                      {unreadCounts[convo.id] > 0 && (
                        <div style={{ background: '#1E4D8C', color: '#fff', fontSize: '9px', fontWeight: '500', borderRadius: '20px', padding: '1px 4px', minWidth: '14px', textAlign: 'center' }}>{unreadCounts[convo.id]}</div>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888' }}>Direct message</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f9f9f9' }}>
        {!activeConvo ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '13px' }}>Select a conversation to start messaging</div>
        ) : (
          <>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', background: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: activeConvo.type === 'direct' ? '50%' : '8px', background: activeConvo.type === 'direct' ? '#EEEDFE' : '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', color: activeConvo.type === 'direct' ? '#3C3489' : '#0C447C' }}>{activeConvo.initials}</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1E4D8C' }}>{activeConvo.name}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>{activeConvo.type === 'direct' ? 'Direct message' : 'Group chat'}</div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#aaa', fontSize: '13px', marginTop: '40px' }}>No messages yet — say hello!</div>
              )}
              {messages.map(msg => {
                const isMe = msg.sender === currentUser
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && <div style={{ fontSize: '11px', color: '#888', marginBottom: '3px', paddingLeft: '4px' }}>{msg.senderName}</div>}
                    <div style={{ maxWidth: '60%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? '#1E4D8C' : '#fff', color: isMe ? '#fff' : '#333', fontSize: '13px', lineHeight: '1.5', border: isMe ? 'none' : '1px solid #eee' }}>
                      {msg.text}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #eee', background: '#fff', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${activeConvo.name}...`}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #eee', fontSize: '13px', outline: 'none', background: '#f9f9f9', color: '#000000' }}
              />
              <button onClick={sendMessage} style={{ padding: '10px 18px', background: '#1E4D8C', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}