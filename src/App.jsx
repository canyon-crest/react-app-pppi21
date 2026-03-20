import { useEffect, useState } from 'react';
import { auth, provider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import Account from './Account';
import Nav from './Nav';
import Footer from './Footer';
import Home from './Home';
import About from './About';
import Download from './Download';
import Reviews from './Reviews';

function getPageFromHash() {
  const hash = window.location.hash.replace('#', '');
  const valid = ['Home', 'About', 'Download', 'Reviews', 'Account'];
  return valid.find((p) => p.toLowerCase() === hash.toLowerCase()) || 'Home';
}

function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState(getPageFromHash);

  useEffect(() => {
    function onHashChange() {
      setActivePage(getPageFromHash());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      // Force token refresh so custom claims (e.g. admin) are available immediately
      await result.user.getIdToken(true);
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
    window.location.hash = page.toLowerCase();
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
      {activePage === 'Home'     && <Home onNavigate={handleNavigate} />}
      {activePage === 'About'    && <About />}
      {activePage === 'Download' && <Download />}
      {activePage === 'Reviews'  && <Reviews user={user} onLogin={handleLogin} />}
      {activePage === 'Account'  && <Account user={user} onLogin={handleLogin} />}
      <Footer />
    </div>
  );
}

export default App;