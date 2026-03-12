import { useState } from 'react';

function About() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'Is this a Selenium replacement?',
      answer:
        'Not exactly. Selenium uses the WebDriver protocol which is inherently detectable. NoDriver4j communicates over CDP and ships a patched browser, so it targets use-cases where stealth matters — account generation, data collection, and similar workflows.',
    },
    {
      question: 'What platforms are supported?',
      answer:
        'The desktop app runs on Windows. The custom Chromium binary is currently built for Windows x64. Linux and macOS support is planned for a future release.',
    },
    {
      question: 'How are fingerprints generated?',
      answer:
        'Fingerprints are sampled from real-world browser data and passed to the Chromium binary via CLI switches. The browser reads these at startup and overrides the relevant APIs at the source level — no JavaScript injection required.',
    },
    {
      question: 'Do I need to build Chromium myself?',
      answer:
        'No. Pre-built binaries with all patches applied are included in the installer.',
    },
  ];

  function handleToggle(index) {
    if (openIndex === index) {
      setOpenIndex(null);
    } else {
      setOpenIndex(index);
    }
  }

  return (
    <div>
      <section className="section about-intro">
        <h1 className="section-title">About the Project</h1>
        <p>
          NoDriver4j is a Java-based browser automation framework built on
          top of the Chrome DevTools Protocol. Unlike Selenium or Playwright,
          it pairs a purpose-built JavaFX desktop app with a custom Chromium
          binary that has fingerprint spoofing compiled directly into the
          browser source.
        </p>
        <p>
          The result is an automation toolkit where every browser instance
          presents a unique, realistic fingerprint — canvas noise, WebGL
          parameters, audio context values, screen geometry, timezone,
          locale, and more — all configurable per-task through simple CLI
          switches.
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">FAQ</h2>
        <p className="section-subtitle">Common questions about NoDriver4j.</p>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className={openIndex === index ? 'faq-item open' : 'faq-item'}>
              <button className="faq-question" onClick={() => handleToggle(index)}>
                {faq.question}
              </button>
              <div
                className="faq-answer"
                style={{ maxHeight: openIndex === index ? '200px' : '0' }}
              >
                <div className="faq-answer-inner">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default About;