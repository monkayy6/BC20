import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const provider = new GoogleAuthProvider();

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email?.endsWith('@psu.edu')) {
        await auth.signOut();
        alert('You must use a PSU email to sign in.');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photo: user.photoURL,
          createdAt: new Date().toISOString()
        });
        navigate('/profile');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', overflow: 'hidden', background: '#0a1628' }}>

      {/* Left Panel */}
      <div style={{ width: '52%', position: 'relative', overflow: 'hidden', background: '#0d1f3c', flexShrink: 0 }}>
        <img
          src="https://dz0zjhi21dz2t.cloudfront.net/media/128629/tour/1478058762110/1366_front.jpg"
          alt="Penn State Behrend Campus"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45, filter: 'saturate(0.6) contrast(1.1)' }}
          onError={e => e.target.style.display = 'none'}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,22,40,0.95) 0%, rgba(10,22,40,0.3) 50%, transparent 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '48px'
        }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '38px', fontWeight: '900', color: '#fff', lineHeight: 1.15, marginBottom: '14px' }}>
            Connect with your<br /><span style={{ color: '#5b9bd5' }}>Behrend</span> community.
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '300', lineHeight: 1.6, maxWidth: '320px' }}>
            Study sessions, class chats, and wellness tools — built for Penn State Behrend students.
          </p>
          <div style={{ display: 'flex', gap: '6px', marginTop: '28px' }}>
            <div style={{ width: '20px', height: '6px', borderRadius: '3px', background: '#5b9bd5' }} />
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f7f8fc', padding: '48px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '44px' }}>
          <div style={{ width: '42px', height: '42px', background: '#1E4D8C', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', color: '#fff', fontFamily: 'Georgia, serif', boxShadow: '0 4px 16px rgba(30,77,140,0.3)' }}>
            BC
          </div>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '17px', fontWeight: '700', color: '#1E4D8C' }}>Behrend Connect</div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '1px', letterSpacing: '0.04em' }}>Penn State Behrend</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700', color: '#0d1f3c', marginBottom: '6px' }}>Welcome back 👋</div>
          <p style={{ fontSize: '13px', color: '#999', fontWeight: '300', marginBottom: '36px', lineHeight: 1.6 }}>
            Sign in with your PSU account to access your classes, sessions, and messages.
          </p>

          {/* PSU badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1px solid #e8eaf0', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '32px', height: '32px', background: '#1E4D8C', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🛡️</div>
            <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.5 }}>
              <div style={{ color: '#1E4D8C', fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>PSU Email Required</div>
              Only @psu.edu accounts are permitted
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e8eaf0' }} />
            <span style={{ fontSize: '11px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sign in with</span>
            <div style={{ flex: 1, height: '1px', background: '#e8eaf0' }} />
          </div>

          {/* Google Button */}
          <button
            onClick={handleLogin}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '14px 20px', background: '#1E4D8C', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', letterSpacing: '0.01em', boxShadow: '0 4px 16px rgba(30,77,140,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#163a6e'}
            onMouseLeave={e => e.currentTarget.style.background = '#1E4D8C'}
          >
            <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            Sign in with Google (PSU)
          </button>

          <p style={{ marginTop: '28px', fontSize: '11px', color: '#bbb', textAlign: 'center', lineHeight: 1.6, fontWeight: '300' }}>
            By signing in, you agree to keep this platform respectful.<br />
            <span style={{ color: '#888', fontWeight: '500' }}>For Penn State Behrend students only.</span>
          </p>
        </div>
      </div>
    </div>
  );
}