import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Calendar from './pages/Calendar'
import Messages from './pages/Messages'
import Classes from './pages/Classes'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ maxWidth: '430px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/classes" element={<Classes />} />
          </Routes>
        </div>
        <nav style={{ display: 'flex', borderTop: '1px solid #eee', background: '#fff' }}>
          <NavLink to="/" style={({ isActive }) => ({ flex: 1, textAlign: 'center', padding: '12px', fontSize: '12px', color: isActive ? '#1E4D8C' : '#888', textDecoration: 'none' })}>Home</NavLink>
          <NavLink to="/calendar" style={({ isActive }) => ({ flex: 1, textAlign: 'center', padding: '12px', fontSize: '12px', color: isActive ? '#1E4D8C' : '#888', textDecoration: 'none' })}>Calendar</NavLink>
          <NavLink to="/messages" style={({ isActive }) => ({ flex: 1, textAlign: 'center', padding: '12px', fontSize: '12px', color: isActive ? '#1E4D8C' : '#888', textDecoration: 'none' })}>Messages</NavLink>
          <NavLink to="/classes" style={({ isActive }) => ({ flex: 1, textAlign: 'center', padding: '12px', fontSize: '12px', color: isActive ? '#1E4D8C' : '#888', textDecoration: 'none' })}>Classes</NavLink>
        </nav>
      </div>
    </BrowserRouter>
  )
}