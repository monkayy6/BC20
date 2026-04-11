import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Calendar from './pages/Calendar'
import Messages from './pages/Messages'
import Classes from './pages/Classes'

export default function App() {
  const navStyle = ({ isActive }) => ({
    display: 'block', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none',
    fontSize: '14px', fontWeight: '500', marginBottom: '4px',
    background: isActive ? '#E6F1FB' : 'transparent',
    color: isActive ? '#1E4D8C' : '#555',
  })

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>

        <div style={{ width: '220px', borderRight: '1px solid #eee', padding: '24px 16px', flexShrink: 0 }}>
          <div style={{ marginBottom: '32px', paddingLeft: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1E4D8C' }}>Behrend Connect</div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Penn State Behrend</div>
          </div>
          <NavLink to="/" style={navStyle}>🏠 Home</NavLink>
          <NavLink to="/calendar" style={navStyle}>📅 Calendar</NavLink>
          <NavLink to="/messages" style={navStyle}>💬 Messages</NavLink>
          <NavLink to="/classes" style={navStyle}>🎓 Classes</NavLink>
          <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 8px', borderTop: '1px solid #eee' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '500', color: '#0C447C' }}>LH</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>Luke H.</div>
                <div style={{ fontSize: '11px', color: '#888' }}>STAT 301, CS 221</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, background: '#f9f9f9', overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/classes" element={<Classes />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  )
}