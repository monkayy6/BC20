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
      const joinedQuery = query(collection(db, 'joined'), where('uid', '==', user.uid), where('sessionId', '==', session.id))
      const joinedSnap = await getDocs(joinedQuery)
      joinedSnap.forEach(async (d) => await deleteDoc(doc(db, 'joined', d.id)))
      const sessionQuery = query(collection(db, 'sessions'), where('uid', '==', user.uid), where('joinedFrom', '==', session.id))
      const sessionSnap = await getDocs(sessionQuery)
      sessionSnap.forEach(async (d) => await deleteDoc(doc(db, 'sessions', d.id)))
      return
    }
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

  const cardStyle = {
    background: '#fff', border: '1px solid #eaecf2',
    borderRadius: '14px', padding: '20px 22px', marginBottom: '16px'
  }

  const cardTitleStyle = {
    fontSize: '14px', fontWeight: '600', color: '#1E4D8C',
    marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  }

  return (
    <div style={{ padding: '28px 32px', background: '#f4f6fb', minHeight: '100vh' }}>

      {/* Header Banner */}
      <div style={{ background: '#1E4D8C', borderRadius: '16px', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', margin: 0 }}>{greeting()}, {firstName}</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Penn State Behrend
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', letterSpacing: '0.03em' }}>PENN STATE</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>Behrend</div>
          </div>
          <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
  <img
    src="https://cdn.freebiesupply.com/logos/large/2x/penn-state-lions-logo-black-and-white.png"
    alt="PSU Logo"
    style={{ width: '34px', height: '34px', objectFit: 'contain' }}
    onError={e => { e.target.style.display = 'none' }}
  />
</div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
        {[
          { icon: '📅', val: sessionsThisWeek, lbl: 'Sessions this week' },
          { icon: '🔥', val: streak, lbl: 'Study streak days' },
        ].map(({ icon, val, lbl }, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #eaecf2', borderRadius: '14px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{icon}</div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: '#1E4D8C', lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>{lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        {/* Left Column */}
        <div>
          {/* Upcoming Sessions */}
          <div style={cardStyle}>
            <div style={cardTitleStyle}>
              Upcoming Sessions
              <button onClick={() => navigate('/calendar')} style={{ padding: '5px 12px', background: '#1E4D8C', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}>+ Schedule</button>
            </div>
            {mySessions.length === 0 && <p style={{ fontSize: '13px', color: '#aaa' }}>No upcoming sessions. Schedule one!</p>}
            {mySessions.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < mySessions.length - 1 ? '1px solid #f3f4f8' : 'none' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>📚</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#222' }}>{s.title}{s.class ? ` — ${s.class}` : ''}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{formatSessionTime(s)}{s.location ? ` · ${s.location}` : ''}</div>
                  </div>
                </div>
                <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '20px', fontWeight: '500', background: s.joinedFrom ? '#E6F1FB' : '#EAF3DE', color: s.joinedFrom ? '#0C447C' : '#27500A' }}>
                  {s.joinedFrom ? 'Joined' : 'Yours'}
                </span>
              </div>
            ))}
          </div>

          {/* Discover Sessions */}
          <div style={cardStyle}>
            <div style={cardTitleStyle}>Discover Sessions</div>
            {discoverSessions.length === 0 && <p style={{ fontSize: '13px', color: '#aaa' }}>No sessions from classmates yet.</p>}
            {discoverSessions.map((s, i) => {
              const joined = joinedIds.includes(s.id)
              return (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < discoverSessions.length - 1 ? '1px solid #f3f4f8' : 'none' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>📚</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#222' }}>{s.title}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{s.class} · {formatSessionTime(s)}{s.location ? ` · ${s.location}` : ''}</div>
                    </div>
                  </div>
                  <button onClick={() => joinSession(s)} style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '20px', fontWeight: '500', border: 'none', cursor: 'pointer', background: joined ? '#FCEBEB' : '#E6F1FB', color: joined ? '#A32D2D' : '#0C447C' }}>
                    {joined ? 'Leave' : 'Join'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Wellness Check-In */}
          <div style={cardStyle}>
            <div style={cardTitleStyle}>Wellness Check-In</div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>How are you feeling today?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[['Stressed', '#FCEBEB', '#A32D2D', '#f5c0c0'], ['Okay', '#f5f5f5', '#555', '#ddd'], ['Good', '#EAF3DE', '#27500A', '#c0dd97'], ['Focused', '#E6F1FB', '#0C447C', '#b5d4f4']].map(([m, bg, color, border]) => (
                <div key={m} onClick={() => setMood(mood === m ? null : m)}
                  style={{ padding: '9px', borderRadius: '10px', background: bg, color, fontSize: '12px', fontWeight: '500', textAlign: 'center', cursor: 'pointer', border: mood === m ? `2px solid #1E4D8C` : `1px solid ${border}`, transition: 'all 0.15s ease', transform: mood === m ? 'scale(1.03)' : 'scale(1)' }}>
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* Study Streak */}
          <div style={cardStyle}>
            <div style={cardTitleStyle}>Study Streak</div>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '12px' }}>
              {days.map((d, i) => (
                <div key={i} onClick={() => toggleDay(i)} style={{ flex: 1, aspectRatio: '1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', cursor: 'pointer', background: completed[i] ? '#1E4D8C' : '#f5f5f5', color: completed[i] ? '#fff' : '#aaa', border: completed[i] ? 'none' : '1px solid #eee', transition: 'all 0.15s ease' }}>{d}</div>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {streak === 0 ? 'Click the days you studied!' : `${streak} day streak — keep it up!`}
            </div>
          </div>

          {/* Gorge Break */}
          <div style={{ background: '#1E4D8C', borderRadius: '14px', overflow: 'hidden' }}>
            <img src="https://erietrails.org/wp-content/uploads/2017/12/Wintergreen-Gorge-Photos_050-800x532.jpg" alt="Wintergreen Gorge" style={{ width: '100%', height: '110px', objectFit: 'cover', opacity: 0.7, display: 'block' }} />
            <div style={{ padding: '16px 18px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>Take a Gorge Break</h3>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>A walk on the Wintergreen Gorge trail can help clear your head.</p>
              <a href="https://erietrails.org/wintergreen-gorge/" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '10px', padding: '6px 14px', background: '#fff', color: '#1E4D8C', borderRadius: '7px', fontSize: '11px', fontWeight: '600', textDecoration: 'none' }}>View trail info</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home