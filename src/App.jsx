import { useEffect, useState } from 'react';
import { auth, provider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import Nav from './Nav';
import Footer from './Footer';
import Home from './Home';
import About from './About';
import Download from './Download';

function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('Home');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  function handleNavigate(page) {
    setActivePage(page);
  }

  return (
    <div className="app">
      <Nav
        activePage={activePage}
        onNavigate={handleNavigate}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      {activePage === 'Home' && <Home onNavigate={handleNavigate} />}
      {activePage === 'About' && <About />}
      {activePage === 'Download' && <Download />}
      <Footer />
    </div>
  );
}

export default App;