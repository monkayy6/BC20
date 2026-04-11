import { useState } from 'react'
function Home({ mood, setMood }) {
  const days = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su']
  const [completed, setCompleted] = useState([false, false, false, false, false, false, false])

  const toggleDay = (i) => {
    setCompleted(prev => prev.map((val, idx) => idx === i ? !val : val))
  }

const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  const calculateStreak = () => {
    let streak = 0
    for (let i = todayIndex; i >= 0; i--) {
      if (completed[i]) streak++
      else break
    }
    return streak
  }

  const streak = calculateStreak()
 
  return (
    <div style={{ padding: '32px' }}>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1E4D8C', margin: 0 }}>Good morning, Luke</h1>
        <p style={{ color: '#888', marginTop: '4px', fontSize: '14px' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Penn State Behrend</p>      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {[['3', 'Sessions this week'], ['4.2h', 'Avg study / day'], [`${streak}`, 'Study Streak Days']].map(([val, lbl], i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '20px 24px' }}>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#1E4D8C' }}>{val}</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: '#1E4D8C' }}>Upcoming Sessions</h2>
              <button style={{ padding: '6px 14px', background: '#1E4D8C', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>+ Schedule</button>
            </div>
            {[
              { name: 'Exam 2 review', time: 'Today · 7:00 PM', location: 'Reed 117', badge: 'Joined', color: '#EAF3DE', text: '#27500A' },
              { name: 'HW 5 collab', time: 'Thu · 3:30 PM', location: 'Virtual', badge: 'Open', color: '#E6F1FB', text: '#0C447C' },
              { name: 'Office hours carpool', time: 'Fri · 1:00 PM', location: 'Hamot lot', badge: '2 spots left', color: '#FAEEDA', text: '#633806' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 2 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📚</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{s.name}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{s.time} · {s.location}</div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: s.color, color: s.text, fontWeight: '500' }}>{s.badge}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px', color: '#1E4D8C' }}>Activity</h2>
            {[
              { text: 'Maya posted Ch. 8 notes for STAT 301', time: '20 min ago', active: true },
              { text: 'Tom joined Exam 2 review session', time: '1 hr ago', active: false },
              { text: 'New session created: Midterm cram — Apr 16', time: '2 hrs ago', active: false },
              { text: 'Jess shared a practice exam in CMPSC 221', time: 'Yesterday', active: false },
            ].map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: i < 3 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.active ? '#1E4D8C' : '#ddd', marginTop: '5px', flexShrink: 0 }}></div>
                <div>
                  <div style={{ fontSize: '13px' }}>{n.text}</div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 14px', color: '#1E4D8C' }}>Wellness Check-In</h2>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>How are you feeling today?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[['Stressed', '#FCEBEB', '#A32D2D'], ['Okay', '#f5f5f5', '#555'], ['Good', '#EAF3DE', '#27500A'], ['Focused', '#E6F1FB', '#0C447C']].map(([m, bg, color]) => (
                <div
                  key={m}
                  onClick={() => setMood(mood === m ? null : m)}
                  style={{
                    padding: '10px', borderRadius: '10px', background: bg, color,
                    fontSize: '13px', fontWeight: '500', textAlign: 'center', cursor: 'pointer',
                    border: mood === m ? '2px solid #1E4D8C' : '1px solid #eee',
                    transform: mood === m ? 'scale(1.03)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                >
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