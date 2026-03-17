function Nav({ activePage, onNavigate, user, onLogin, onLogout }) {
  const links = ['Home', 'About', 'Download'];

  return (
    <nav className="navbar">
      <span className="nav-brand">NoDriver4j</span>
      <ul className="nav-links">
        {links.map((page) => (
          <li key={page}>
            <button
              className={activePage === page ? 'nav-button active' : 'nav-button'}
              onClick={() => onNavigate(page)}
            >
              {page}
            </button>
          </li>
        ))}
        <li>
          {user ? (
            <button className="nav-button" onClick={onLogout}>
              Log Out
            </button>
          ) : (
            <button className="nav-button" onClick={onLogin}>
              Login
            </button>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default Nav;