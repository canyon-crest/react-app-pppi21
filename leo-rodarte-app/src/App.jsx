import { useState } from 'react';
import Nav from './Nav';
import Footer from './Footer';
import Home from './Home';
import About from './About';
import Download from './Download';

function App() {
  const [activePage, setActivePage] = useState('Home');

  function handleNavigate(page) {
    setActivePage(page);
  }

  return (
    <div className="app">
      <Nav activePage={activePage} onNavigate={handleNavigate} />
      {activePage === 'Home' && <Home onNavigate={handleNavigate} />}
      {activePage === 'About' && <About />}
      {activePage === 'Download' && <Download />}
      <Footer />
    </div>
  );
}

export default App;