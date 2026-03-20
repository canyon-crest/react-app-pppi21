function Nav({ activePage, onNavigate, user, onLogin, onLogout }) {
  const links = ['Home', 'About', 'Reviews', 'Download'];

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
        {user ? (
          <>
            <li>
              <button
                className={activePage === 'Account' ? 'nav-button active' : 'nav-button'}
                onClick={() => onNavigate('Account')}
              >
                {user.displayName || 'Account'}
              </button>
            </li>
            <li>
              <button className="nav-button" onClick={onLogout}>
                Log Out
              </button>
            </li>
          </>
        ) : (
          <li>
            <button className="nav-button" onClick={onLogin}>
              Login
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Nav;