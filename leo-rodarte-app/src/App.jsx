import { useEffect, useState } from 'react';
import { db, auth, provider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import Nav from './Nav';
import Footer from './Footer';
import Home from './Home';
import About from './About';
import Download from './Download';

function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('Home');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

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
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const fetchMessages = async () => {
    const snapshot = await getDocs(collection(db, 'messages'));
    const list = snapshot.docs.map((doc) => doc.data());
    setMessages(list);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    await addDoc(collection(db, 'messages'), {
      text: input,
      name: user.displayName,
      timestamp: Date.now(),
    });
    setInput('');
    fetchMessages();
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  function handleNavigate(page) {
    setActivePage(page);
  }

  if (!user) {
    return (
      <div className="app">
        <Nav activePage={activePage} onNavigate={handleNavigate} />
        <section className="hero">
          <h1>Welcome to NoDriver4j</h1>
          <p>Please log in with Google to continue.</p>
          <button className="btn btn-primary" onClick={handleLogin}>
            Login with Google
          </button>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      <Nav activePage={activePage} onNavigate={handleNavigate} />
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          Hello, {user.displayName}
        </p>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Log Out
        </button>
      </div>
      {activePage === 'Home' && <Home onNavigate={handleNavigate} />}
      {activePage === 'About' && <About />}
      {activePage === 'Download' && <Download />}
      <section className="section">
        <h2 className="section-title">Messages</h2>
        <p className="section-subtitle">Leave a message for the community.</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '0.7rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
            }}
          />
          <button className="btn btn-primary" onClick={sendMessage}>
            Send
          </button>
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {messages.map((msg, i) => (
            <li
              key={i}
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>
                {msg.name || 'Anon'}:
              </strong>{' '}
              {msg.text}
            </li>
          ))}
        </ul>
      </section>
      <Footer />
    </div>
  );
}

export default App;