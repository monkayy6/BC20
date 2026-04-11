import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const provider = new GoogleAuthProvider();

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const email = user.email;

    if (!email || !email.endsWith("@psu.edu")) {
      await auth.signOut();
      alert("You must use a PSU email to sign in.");
      return;
    }

    // Check if user already exists in Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);



   if (!userSnap.exists()) {
  await setDoc(userRef, {
  email: user.email,
  displayName: user.displayName,
  photo: user.photoURL,
  createdAt: userSnap.exists() ? userSnap.data().createdAt : new Date().toISOString()
}, { merge: true })

if (!userSnap.exists()) {
  navigate('/profile')
} else {
  navigate('/')
}
  navigate('/profile')
} else {
  navigate('/')
}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h1 style={{ color: '#1E4D8C' }}>Behrend Connect</h1>
      <p style={{ color: '#888' }}>Penn State Behrend</p>
      <button onClick={handleLogin} style={{ marginTop: '24px', padding: '12px 24px', background: '#1E4D8C', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>
        Sign in with PSU Email
      </button>
    </div>
  );
}