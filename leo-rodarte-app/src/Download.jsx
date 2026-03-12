function Download() {
  const links = [
    { title: 'Discord', description: 'Join the community server' },
    { title: 'YouTube', description: 'Watch the demo video' },
    { title: 'License Key', description: 'Purchase or activate a key' },
  ];

  return (
    <div>
      <section className="download-hero">
        <h1>Get NoDriver4j</h1>
        <p>Download the latest release or join the community.</p>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="download-card">
          <h2>NoDriver4j Installer</h2>
          <p className="version">v0.1.0-beta {'\u00B7'} Windows x64</p>
          
            className="btn btn-primary"
            href="https://github.com/pppi21/laksdjfoinvsad"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download Setup.exe
          </a>
        </div>

        <div className="links-grid">
          {links.map((link) => (
            <div key={link.title} className="link-card">
              <h3>{link.title}</h3>
              <p>{link.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Download;