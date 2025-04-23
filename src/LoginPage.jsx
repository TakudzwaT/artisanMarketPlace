// LoginPage.js
import { auth, provider, db } from './firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();

  const login = async (role) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Store user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: role,
      });

      console.log(`${role} logged in:`, user);
      if (role === 'Seller') navigate('/manage');
      else navigate('/buyer');
    } catch (error) {
      console.error('Login Error:', error);
    }
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#EFE6DD', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#4B3621' }}>Login to Artisan Market</h2>
      <section>
        <button onClick={() => login('Buyer')} style={{ margin: '1rem', padding: '0.75rem 1.5rem', backgroundColor: '#DBA159', color: 'white', border: 'none', borderRadius: '6px' }}>Login with Google (Buyer)</button>
        <button onClick={() => login('Seller')} style={{ margin: '1rem', padding: '0.75rem 1.5rem', backgroundColor: '#A9744F', color: 'white', border: 'none', borderRadius: '6px' }}>Login with Google (Seller)</button>
      </section>
    </main>
  );
}
