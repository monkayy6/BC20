import { useState, useEffect, useRef } from 'react'
import { db, auth } from '../firebase'
import { collection, query, where, onSnapshot, addDoc, doc, getDoc, getDocs, deleteDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
 
function Home({ mood, setMood }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [mySessions, setMySessions] = useState([])
  const [discoverSessions, setDiscoverSessions] = useState([])
  const [joinedIds, setJoinedIds] = useState([])
  const [completed, setCompleted] = useState([false, false, false, false, false, false, false])
  const [studyMinutes, setStudyMinutes] = useState(0)
  const sessionStart = useRef(null)
  const days = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su']
  const navigate = useNavigate()
 
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
 
  const toggleDay = (i) => {
    setCompleted(prev => prev.map((val, idx) => idx === i ? !val : val))
  }
 
  const calculateStreak = () => {
    let streak = 0
    for (let i = todayIndex; i >= 0; i--) {
      if (completed[i]) streak++
      else break
    }
    return streak
  }
 
  const streak = calculateStreak()
 
  const getTodayKey = () => new Date().toISOString().split('T')[0]
 
  const formatStudyTime = (minutes) => {
    if (minutes < 1) return '0m'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }
 
  // Get user + profile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) setProfile(snap.data())
      }
    })
    return unsub
  }, [])
 
  // Track active tab time
  useEffect(() => {
    if (!user) return
 
    const saved = localStorage.getItem(`studyMinutes_${user.uid}_${getTodayKey()}`)
    if (saved) setStudyMinutes(parseInt(saved))
 
    sessionStart.current = Date.now()
 
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sessionStart.current = Date.now()
      } else {
        if (sessionStart.current) {
          const elapsed = Math.floor((Date.now() - sessionStart.current) / 60000)
          setStudyMinutes(prev => {
            const newTotal = prev + elapsed
            localStorage.setItem(`studyMinutes_${user.uid}_${getTodayKey()}`, newTotal)
            return newTotal
          })
          sessionStart.current = null
        }
      }
    }
 
    const interval = setInterval(() => {
      if (sessionStart.current) {
        const elapsed = Math.floor((Date.now() - sessionStart.current) / 60000)
        setStudyMinutes(() => {
          const base = parseInt(localStorage.getItem(`studyMinutes_${user.uid}_${getTodayKey()}`) || 0)
          return base + elapsed
        })
      }
    }, 60000)
 
    document.addEventListener('visibilitychange', handleVisibility)
 
    return () => {
      clearInterval(interval)
      if (sessionStart.current) {
        const elapsed = Math.floor((Date.now() - sessionStart.current) / 60000)
        setStudyMinutes(prev => {
          const newTotal = prev + elapsed
          localStorage.setItem(`studyMinutes_${user.uid}_${getTodayKey()}`, newTotal)
          return newTotal
        })
      }
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user])
 
  // Get my upcoming sessions (exclude ones joined from others — those show in discover)
  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const q = query(
      collection(db, 'sessions'),
      where('uid', '==', user.uid),
      where('date', '>=', today)
    )
    const unsub = onSnapshot(q, (snap) => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
      setMySessions(sorted.slice(0, 3))
    })
    return unsub
  }, [user])
 
  // Get discover sessions from others in same classes
  useEffect(() => {
    if (!user || !profile?.myClasses?.length) return
    const today = new Date().toISOString().split('T')[0]
    const q = query(
      collection(db, 'sessions'),
      where('class', 'in', profile.myClasses),
      where('date', '>=', today)
    )
    const unsub = onSnapshot(q, (snap) => {
      const others = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.uid !== user.uid && !s.joinedFrom)
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
      setDiscoverSessions(others)
    })
    return unsub
  }, [user, profile])
 
  // Get joined session ids
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'joined'), where('uid', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      setJoinedIds(snap.docs.map(d => d.data().sessionId))
    })
    return unsub
  }, [user])
 
  const joinSession = async (session) => {
    if (!user) return
 
    if (joinedIds.includes(session.id)) {
      // Leave — remove from joined collection and delete the copied session
      const joinedQuery = query(collection(db, 'joined'), where('uid', '==', user.uid), where('sessionId', '==', session.id))
      const joinedSnap = await getDocs(joinedQuery)
      joinedSnap.forEach(async (d) => await deleteDoc(doc(db, 'joined', d.id)))
 
      const sessionQuery = query(collection(db, 'sessions'), where('uid', '==', user.uid), where('joinedFrom', '==', session.id))
      const sessionSnap = await getDocs(sessionQuery)
      sessionSnap.forEach(async (d) => await deleteDoc(doc(db, 'sessions', d.id)))
 
      return
    }
 
    // Join
    await addDoc(collection(db, 'joined'), { uid: user.uid, sessionId: session.id })
    await addDoc(collection(db, 'sessions'), {
      uid: user.uid,
      title: session.title,
      class: session.class,
      date: session.date,
      time: session.time,
      location: session.location,
      joinedFrom: session.id
    })
  }
 
  // Count sessions this week
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)
  const sessionsThisWeek = mySessions.filter(s => {
    const d = new Date(s.date)
    return d >= startOfWeek && d <= endOfWeek
  }).length
 
  const formatSessionTime = (s) => {
    const d = new Date(s.date + 'T00:00:00')
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    let dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
    if (d.toDateString() === today.toDateString()) dayLabel = 'Today'
    if (d.toDateString() === tomorrow.toDateString()) dayLabel = 'Tomorrow'
    const [h, m] = s.time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const display = `${hour % 12 || 12}:${m} ${ampm}`
    return `${dayLabel} · ${display}`
  }
 
  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }
 
  const firstName = profile?.name?.split(' ')[0] || 'there'
 
  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1E4D8C', margin: 0 }}>{greeting()}, {firstName}</h1>
        <p style={{ color: '#888', marginTop: '4px', fontSize: '14px' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Penn State Behrend</p>
      </div>
 
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {[[`${sessionsThisWeek}`, 'Sessions this week'], [formatStudyTime(studyMinutes), 'Study time today'], [`${streak}`, 'Study Streak Days']].map(([val, lbl], i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '20px 24px' }}>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#1E4D8C' }}>{val}</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{lbl}</div>
          </div>
        ))}
      </div>
 
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
 
          {/* Upcoming Sessions */}
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: '#1E4D8C' }}>Upcoming Sessions</h2>
              <button onClick={() => navigate('/calendar')} style={{ padding: '6px 14px', background: '#1E4D8C', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>+ Schedule</button>
            </div>
            {mySessions.length === 0 && <p style={{ color: '#888', fontSize: '13px' }}>No upcoming sessions. Schedule one!</p>}
            {mySessions.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < mySessions.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📚</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{s.title}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{formatSessionTime(s)}{s.location ? ` · ${s.location}` : ''}</div>
                  </div>
                </div>
              <span style={{
  fontSize: '11px', padding: '4px 10px', borderRadius: '20px',
  background: s.joinedFrom ? '#E6F1FB' : '#EAF3DE',
  color: s.joinedFrom ? '#0C447C' : '#27500A',
  fontWeight: '500'
}}> 
  {s.joinedFrom ? 'Joined' : 'Yours'} 
</span>
              </div>
            ))}
          </div>
 
          {/* Discover Sessions */}
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px', color: '#1E4D8C' }}>Discover Sessions</h2>
            {discoverSessions.length === 0 && <p style={{ color: '#888', fontSize: '13px' }}>No sessions from classmates yet.</p>}
            {discoverSessions.map((s, i) => {
              const joined = joinedIds.includes(s.id)
              return (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < discoverSessions.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📚</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>{s.title}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{s.class} · {formatSessionTime(s)}{s.location ? ` · ${s.location}` : ''}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => joinSession(s)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: joined ? '#FCEBEB' : '#E6F1FB',
                      color: joined ? '#A32D2D' : '#0C447C',
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer'
                    }}>
                    {joined ? 'Leave' : 'Join'}
                  </button>
                </div>
              )
            })}
          </div>
 
        </div>
 
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 14px', color: '#1E4D8C' }}>Wellness Check-In</h2>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>How are you feeling today?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[['Stressed', '#FCEBEB', '#A32D2D'], ['Okay', '#f5f5f5', '#555'], ['Good', '#EAF3DE', '#27500A'], ['Focused', '#E6F1FB', '#0C447C']].map(([m, bg, color]) => (
                <div key={m} onClick={() => setMood(mood === m ? null : m)}
                  style={{ padding: '10px', borderRadius: '10px', background: bg, color, fontSize: '13px', fontWeight: '500', textAlign: 'center', cursor: 'pointer', border: mood === m ? '2px solid #1E4D8C' : '1px solid #eee', transform: mood === m ? 'scale(1.03)' : 'scale(1)', transition: 'all 0.15s ease' }}>
                  {m}
                </div>
              ))}
            </div>
          </div>
 
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 14px', color: '#1E4D8C' }}>Study Streak</h2>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              {days.map((d, i) => (
                <div key={i} onClick={() => toggleDay(i)} style={{ flex: 1, aspectRatio: '1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', background: completed[i] ? '#1E4D8C' : '#f5f5f5', color: completed[i] ? '#fff' : '#aaa', border: completed[i] ? 'none' : '1px solid #eee', cursor: 'pointer', transition: 'all 0.15s ease' }}>{d}</div>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {streak === 0 ? 'Click the days you studied!' : `${streak} day streak — keep it up!`}
            </div>
          </div>
 
          <div style={{ background: '#1E4D8C', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
            <img src="https://erietrails.org/wp-content/uploads/2017/12/Wintergreen-Gorge-Photos_050-800x532.jpg" alt="Wintergreen Gorge" style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 8px', color: '#fff' }}>Take a Gorge Break</h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6' }}>You've been studying for a while. A walk on the Wintergreen Gorge trail can help clear your head.</p>
              <a href="https://erietrails.org/wintergreen-gorge/" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '12px', padding: '8px 16px', background: '#fff', color: '#1E4D8C', borderRadius: '8px', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>View trail info</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
 
export default Home