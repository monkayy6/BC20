import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore'

function Classes() {
  const [classes, setClasses] = useState([])
  const [view, setView] = useState('main')

  const allClasses = [
    'CS 101', 'CS 201', 'CS 221', 'CS 330', 'CS 444',
    'MATH 140', 'MATH 141', 'MATH 230', 'STAT 301',
    'ENGL 015', 'COMM 150', 'BIOL 110', 'CHEM 110',
    'PHYS 211', 'ECON 102', 'PSYCH 100'
  ]

  useEffect(() => {
    const q = query(collection(db, 'classes'), where('uid', '==', 'test-user'))
    const unsub = onSnapshot(q, (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const addClass = async (className) => {
    if (classes.find(c => c.name === className)) return
    await addDoc(collection(db, 'classes'), { uid: 'test-user', name: className })
  }

  const removeClass = async (id) => {
    await deleteDoc(doc(db, 'classes', id))
  }

  if (view === 'add') return (
    <div style={{ padding: '24px' }}>
      <button onClick={() => setView('main')} style={{ marginBottom: '16px', cursor: 'pointer' }}>← Back</button>
      <h2>Add a Class</h2>
      {allClasses.map(c => (
        <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
          <span>{c}</span>
          <button onClick={() => addClass(c)} style={{ cursor: 'pointer', background: '#1E4D8C', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px' }}>
            {classes.find(cl => cl.name === c) ? 'Added' : 'Add'}
          </button>
        </div>
      ))}
    </div>
  )

  if (view === 'remove') return (
    <div style={{ padding: '24px' }}>
      <button onClick={() => setView('main')} style={{ marginBottom: '16px', cursor: 'pointer' }}>← Back</button>
      <h2>Remove a Class</h2>
      {classes.length === 0 && <p>No classes added yet.</p>}
      {classes.map(c => (
        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
          <span>{c.name}</span>
          <button onClick={() => removeClass(c.id)} style={{ cursor: 'pointer', background: '#cc0000', color: '#fff', border: 'none', borderRadius: '8px', padding: '4px 12px' }}>Remove</button>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ color: '#1E4D8C' }}>My Classes</h2>
      {classes.length === 0 && <p style={{ color: '#1E4D8C' }}>No classes added yet.</p>}
      {classes.map(c => (
        <div key={c.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{c.name}</div>
      ))}
      <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
        <button onClick={() => setView('add')} style={{ padding: '10px 20px', background: '#1E4D8C', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Add Class</button>
        <button onClick={() => setView('remove')} style={{ padding: '10px 20px', background: '#cc0000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Remove Class</button>
      </div>
    </div>
  )
}

export default Classes