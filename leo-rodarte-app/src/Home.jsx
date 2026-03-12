import Card from './Card';

function Home({ onNavigate }) {
  const features = [
    {
      title: 'Profile Management',
      description:
        'Import profiles from CSV, group them, and assign proxies. Each task keeps its own userdata directory for persistent sessions.',
    },
    {
      title: 'Task Execution',
      description:
        'Run automation scripts in parallel with live logging, a visual browser viewer, and manual browser mode for debugging.',
    },
    {
      title: 'CAPTCHA Solving',
      description:
        'Built-in ReCaptcha solver integration. Automatically detects and solves challenges during navigation.',
    },
  ];

  return (
    <div>
      <section className="hero">
        <h1>
          Browser Automation,<br />
          <span>Undetected.</span>
        </h1>
        <p>
          A CDP-based automation toolkit with a custom Chromium build.
          Spoof fingerprints, manage profiles, and run headless tasks
          from a single desktop app.
        </p>
        <div className="hero-buttons">
          <button className="btn btn-primary" onClick={() => onNavigate('Download')}>
            Download
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('About')}>
            Learn More
          </button>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Core Features</h2>
        <p className="section-subtitle">Everything you need to stay undetected.</p>
        <div className="features-grid">
          {features.map((feature) => (
            <Card
              key={feature.title}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;