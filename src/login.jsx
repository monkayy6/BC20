import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./firebase";


const provider = new GoogleAuthProvider();

export default function Login() {
  const handleLogin = async () => {
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email;

    if (!email || !email.endsWith("@psu.edu")) {
      await auth.signOut();
      alert("You must use a PSU email to sign in.");
    }
  };

  return (
    <div>
      <h1>Behrend Connect</h1>
      <button onClick={handleLogin}>Sign in with PSU Email</button>
    </div>
  );
}