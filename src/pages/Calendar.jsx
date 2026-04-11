import { useState, useEffect } from 'react'
import { db, auth } from '../firebase'
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

const DOT_COLORS = ['#1E4D8C', '#e67e22', '#27ae60', '#8e44ad']

function Calendar() {
  const [sessions, setSessions] = useState([])
  const [user, setUser] = useState(null)
  const [myClasses, setMyClasses] = useState([])
  const [view, setView] = useState('main')
  const [form, setForm] = useState({ title: '', class: '', date: '', time: '', location: '' })
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) setMyClasses(snap.data().myClasses || [])
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'sessions'), where('uid', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [user])

  const addSession = async () => {
    if (!user) return
    if (!form.title || !form.date || !form.time) return alert('Please fill in title, date, and time')
    const selectedDateObj = new Date(form.date + 'T' + form.time)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDateOnly = new Date(form.date + 'T00:00:00')
    if (isNaN(selectedDateObj.getTime())) return alert('Please enter a valid date and time')
    if (selectedDateOnly < today) return alert('Please select a date today or in the future')
    if (selectedDateOnly.getTime() === today.getTime() && selectedDateObj < new Date()) return alert('Please select a future time for today')
    await addDoc(collection(db, 'sessions'), { uid: user.uid, ...form })
    setForm({ title: '', class: '', date: '', time: '', location: '' })
    setView('main')
  }

  const deleteSession = async (id) => {
    await deleteDoc(doc(db, 'sessions', id))
  }

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentMonth.toLocaleString('default', { month: 'long' })
  const todayObj = new Date()

  const sessionsByDate = sessions.reduce((acc, s) => {
    acc[s.date] = acc[s.date] ? [...acc[s.date], s] : [s]
    return acc
  }, {})

  const prevMonth = () => { setCurrentMonth(new Date(year, month - 1, 1)); setSelectedDate(null) }
  const nextMonth = () => { setCurrentMonth(new Date(year, month + 1, 1)); setSelectedDate(null) }

  const displayedSessions = selectedDate
    ? (sessionsByDate[selectedDate] || [])
    : [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date))

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  const CalendarGrid = () => {
    const cells = []
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} />)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const isToday = d === todayObj.getDate() && month === todayObj.getMonth() && year === todayObj.getFullYear()
      const isSelected = selectedDate === dateStr
      const daySessions = sessionsByDate[dateStr] || []
      const count = daySessions.length

      cells.push(
        <div key={d} onClick={() => setSelectedDate(isSelected ? null : dateStr)}
          style={{ textAlign: 'center', padding: '6px 0', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
            background: isSelected ? '#E6F1FB' : isToday ? '#1E4D8C' : 'transparent',
            color: isToday ? '#fff' : '#333', fontWeight: isToday || isSelected ? '700' : '400' }}>
          {d}
          {count > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '2px', flexWrap: 'wrap' }}>
              {count <= 3
                ? daySessions.map((_, i) => (
                    <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: DOT_COLORS[i % DOT_COLORS.length] }} />
                  ))
                : <>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1E4D8C' }} />
                    <div style={{ fontSize: '9px', color: '#1E4D8C', fontWeight: '700', lineHeight: '5px' }}>3+</div>
                  </>
              }
            </div>
          )}
        </div>
      )
    }
    return cells
  }

  if (view === 'add') return (
    <div style={{ padding: '24px', maxWidth: '500px' }}>
      <button onClick={() => setView('main')} style={{ marginBottom: '16px', cursor: 'pointer' }}>← Back</button>
      <h2 style={{ color: '#1E4D8C' }}>New Study Session</h2>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Title</label>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }} />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Class</label>
        <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}>
          <option value=''>-- Select a class --</option>
          {myClasses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Date</label>
        <input type='date' value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }} />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Time</label>
        <input type='time' value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }} />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Location</label>
        <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }} />
      </div>

      <button onClick={addSession} style={{ padding: '10px 24px', background: '#1E4D8C', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '8px' }}>
        Save Session
      </button>
    </div>
  )

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '30px', color: '#1E4D8C' }}>‹</button>
          <div style={{ fontWeight: '700', color: '#1E4D8C' }}>{monthName} {year}</div>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '30px', color: '#1E4D8C' }}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} style={{ fontSize: '11px', color: '#888', fontWeight: '600', paddingBottom: '4px' }}>{d}</div>
          ))}
          <CalendarGrid />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ color: '#1E4D8C', margin: 0 }}>
          {selectedDate ? `Study Sessions for ${formatDate(selectedDate)}` : 'All Study Sessions'}
        </h2>
        <button onClick={() => setView('add')} style={{ padding: '8px 16px', background: '#1E4D8C', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>+ New Session</button>
      </div>

      {displayedSessions.length === 0 && (
        <p style={{ color: '#888' }}>{selectedDate ? 'No sessions on this day.' : 'No sessions yet. Add one!'}</p>
      )}
      {displayedSessions.map(s => (
        <div key={s.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: '#1E4D8C' }}>{s.title}</div>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{s.class} · {s.date} · {s.time}</div>
              {s.location && <div style={{ fontSize: '13px', color: '#888' }}>📍 {s.location}</div>}
            </div>
            <button onClick={() => deleteSession(s.id)} style={{ background: 'none', border: 'none', color: '#cc0000', cursor: 'pointer', fontSize: '18px' }}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Calendar