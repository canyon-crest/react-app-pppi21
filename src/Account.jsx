import { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const getLicenseInfo = httpsCallable(functions, 'getLicenseInfo');
const generateLicenseKey = httpsCallable(functions, 'generateLicenseKey');
const revealLicenseKey = httpsCallable(functions, 'revealLicenseKey');
const resetLicenseIps = httpsCallable(functions, 'resetLicenseIps');

const MASKED_KEY = 'ND4J-\u2022\u2022\u2022\u2022-\u2022\u2022\u2022\u2022-\u2022\u2022\u2022\u2022';

function Account({ user, onLogin }) {
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revealedKey, setRevealedKey] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchLicenseInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLicenseInfo();
      setLicense(result.data);
    } catch (err) {
      console.error('Failed to load license info:', err);
      setError('Failed to load license info.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchLicenseInfo();
    } else {
      setLoading(false);
    }
  }, [user, fetchLicenseInfo]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateLicenseKey();
      setRevealedKey(result.data.key);
      await fetchLicenseInfo();
    } catch (err) {
      const message = err.code === 'functions/already-exists'
        ? 'You already have a license key.'
        : 'Failed to generate license key.';
      setError(message);
      console.error('Generate failed:', err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevealAndCopy() {
    setError(null);
    try {
      const result = await revealLicenseKey();
      const key = result.data.key;
      setRevealedKey(key);
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Reveal failed:', err);
      setError('Failed to reveal license key.');
    }
  }

  async function handleReset() {
    setResetting(true);
    setError(null);
    try {
      await resetLicenseIps();
      setShowConfirm(false);
      await fetchLicenseInfo();
    } catch (err) {
      console.error('Reset failed:', err);
      setError('Failed to reset bound IPs.');
    } finally {
      setResetting(false);
    }
  }

  if (!user) {
    return (
      <div className="section account-section">
        <h1 className="section-title">Account</h1>
        <p className="section-subtitle">You must be logged in to view your account.</p>
        <button className="btn btn-primary" onClick={onLogin}>Login</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="section account-section">
        <p className="section-subtitle">Loading account...</p>
      </div>
    );
  }

  return (
    <div>
      <section className="section account-section">
        <h1 className="section-title">Account</h1>
        <p className="section-subtitle">{user.email}</p>

        {error && <p className="account-error">{error}</p>}

        {/* No license yet */}
        {license && !license.hasLicense && (
          <div className="card account-card">
            <h3>No License Key</h3>
            <p className="account-muted">Generate a license key to get started.</p>
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate License'}
            </button>
          </div>
        )}

        {/* License exists */}
        {license && license.hasLicense && (
          <>
            {/* License key card */}
            <div className="card account-card">
              <h3>License Key</h3>
              <div className="key-display">
                <code className="key-value">
                  {revealedKey || MASKED_KEY}
                </code>
                <button className="btn btn-secondary" onClick={handleRevealAndCopy}>
                  {copied ? 'Copied!' : revealedKey ? 'Copy' : 'Reveal & Copy'}
                </button>
              </div>
              <div className="key-meta">
                <span className={`status-badge status-${license.status}`}>
                  {license.status}
                </span>
                {license.createdAt && (
                  <span className="account-muted">
                    Created {new Date(license.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Bound IPs card */}
            <div className="card account-card">
              <div className="ip-header">
                <h3>Bound IPs</h3>
                <span className="account-muted">
                  {license.boundIps.length} / 2 slots used
                </span>
              </div>
              {license.boundIps.length > 0 ? (
                <ul className="ip-list">
                  {license.boundIps.map((ip) => (
                    <li key={ip} className="ip-item">
                      <code>{ip}</code>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="account-muted">No IPs bound to this license.</p>
              )}

              {/* Reset flow */}
              {license.boundIps.length > 0 && !showConfirm && (
                <button
                  className="btn btn-danger"
                  onClick={() => setShowConfirm(true)}
                >
                  Reset Bound IPs
                </button>
              )}
              {showConfirm && (
                <div className="confirm-box">
                  <p>Are you sure? This will unbind all IPs from your license.</p>
                  <div className="form-actions">
                    <button
                      className="btn btn-danger"
                      onClick={handleReset}
                      disabled={resetting}
                    >
                      {resetting ? 'Resetting...' : 'Yes, Reset'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default Account;