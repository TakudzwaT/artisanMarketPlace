// SignupPage.js
import { auth, provider, db } from './firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const navigate = useNavigate();

  const signup = async (role) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Save to Firestore using uid as ID
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: role,
      });

      console.log(`${role} signed up:`, user);
      role === 'Seller' ? navigate('/createStore') : navigate('/buyer');
    } catch (error) {
      console.error('Signup Error:', error);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#FAF3E3',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ color: '#4B3621' }}>Sign up for Artisan Market</h2>
      <section>
        <button
          onClick={() => signup('Buyer')}
          style={{
            margin: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#DBA159',
            color: 'white',
            border: 'none',
            borderRadius: '6px'
          }}>
          Sign up with Google (Buyer)
        </button>
        <button
          onClick={() => signup('Seller')}
          style={{
            margin: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#A9744F',
            color: 'white',
            border: 'none',
            borderRadius: '6px'
          }}>
          Sign up with Google (Seller)
        </button>
      </section>
    </main>
  );
}
