import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useNavigate } from 'react-router-dom'

export default function ProfileSetup() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const navigate = useNavigate()

  const handleCreate = async () => {
    if (!firstName.trim() || !lastName.trim()) return alert('Please enter your first and last name')
    const user = auth.currentUser
    await updateDoc(doc(db, 'users', user.uid), {
      name: `${firstName.trim()} ${lastName.trim()}`,
      initials: `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`
    })
    navigate('/')
  }

  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#1E4D8C', marginBottom: '8px' }}>Set Up Your Profile</h2>
      <p style={{ color: '#888', marginBottom: '32px' }}>Let's get you started</p>

      {/* Avatar preview */}
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#1E4D8C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '32px' }}>
        {initials || '?'}
      </div>

      <div style={{ width: '300px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#555' }}>First Name</label>
          <input
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="John"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#555' }}>Last Name</label>
          <input
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Smith"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
        <button onClick={handleCreate} style={{ width: '100%', padding: '12px', background: '#1E4D8C', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '600' }}>
          Create Profile
        </button>
      </div>
    </div>
  )
}