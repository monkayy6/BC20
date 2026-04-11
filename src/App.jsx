import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase'
import Home from './pages/Home'
import Calendar from './pages/Calendar'
import Messages from './pages/Messages'
import Classes from './pages/Classes'
import Login from './login'
import ProfileSetup from './pages/Profile'

export default function App() {
  const [mood, setMood] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const moodEmoji = {
    Stressed: '😓',
    Okay: '😐', 
    Good: '😊',
    Focused: '🔥'
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
  const unsubProfile = onSnapshot(doc(db, 'users', u.uid), (snap) => {
    if (snap.exists()) setProfile(snap.data())
  })
  return unsubProfile
} else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const navStyle = ({ isActive }) => ({
    display: 'block', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none',
    fontSize: '14px', fontWeight: '500', marginBottom: '4px',
    background: isActive ? '#E6F1FB' : 'transparent',
    color: isActive ? '#1E4D8C' : '#555',
  })

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#1E4D8C' }}>Loading...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/profile" element={user ? <ProfileSetup /> : <Navigate to="/login" />} />
        <Route path="*" element={
          !user ? <Navigate to="/login" /> : (
            <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
              <div style={{ width: '220px', borderRight: '1px solid #eee', padding: '24px 16px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '16px', paddingLeft: '8px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1E4D8C' }}>Behrend Connect</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Penn State Behrend</div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '0 0 16px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', marginBottom: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1E4D8C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '500', color: '#fff' }}>{initials}</div>
                    {mood && (
                      <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '12px', lineHeight: 1 }}>{moodEmoji[mood]}</div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>{profile?.name || 'User'}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{mood ? mood : (profile?.email || '')}</div>
                  </div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '0 0 16px' }} />
                <NavLink to="/" style={navStyle}>🏠 Home</NavLink>
                <NavLink to="/calendar" style={navStyle}>📅 Calendar</NavLink>
                <NavLink to="/messages" style={navStyle}>💬 Messages</NavLink>
                <NavLink to="/classes" style={navStyle}>🎓 Classes</NavLink>
              </div>
              <div style={{ flex: 1, background: '#f9f9f9', overflowY: 'auto' }}>
                <Routes>
                  <Route path="/" element={<Home setMood={setMood} mood={mood} />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/classes" element={<Classes />} />
                </Routes>
              </div>
            </div>
          )
        } />
      </Routes>
    </BrowserRouter>
  )
}