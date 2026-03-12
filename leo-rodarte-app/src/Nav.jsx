function Nav({ activePage, onNavigate }) {
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
      </ul>
    </nav>
  );
}

export default Nav;