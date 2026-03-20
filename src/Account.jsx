import { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const getLicenseInfo = httpsCallable(functions, 'getLicenseInfo');
const generateLicenseKey = httpsCallable(functions, 'generateLicenseKey');
const revealLicenseKey = httpsCallable(functions, 'revealLicenseKey');
const resetLicenseMachines = httpsCallable(functions, 'resetLicenseMachines');

const MASKED_KEY = '\u2022\u2022\u2022\u2022\u2022\u2022-\u2022\u2022\u2022\u2022\u2022\u2022-\u2022\u2022\u2022\u2022\u2022\u2022-\u2022\u2022\u2022\u2022\u2022\u2022-\u2022\u2022\u2022\u2022\u2022\u2022-\u2022\u2022';

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
      await resetLicenseMachines();
      setShowConfirm(false);
      await fetchLicenseInfo();
    } catch (err) {
      console.error('Reset failed:', err);
      setError('Failed to reset machines.');
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
                <span className={`status-badge status-${license.status.toLowerCase()}`}>
                  {license.status}
                </span>
                {license.createdAt && (
                  <span className="account-muted">
                    Created {new Date(license.createdAt).toLocaleDateString()}
                  </span>
                )}
                {license.expiry && (
                  <span className="account-muted">
                    Expires {new Date(license.expiry).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Machines card */}
            <div className="card account-card">
              <div className="ip-header">
                <h3>Devices</h3>
                <span className="account-muted">
                  {license.machines.length} / {license.maxMachines} slots used
                </span>
              </div>
              {license.machines.length > 0 ? (
                <ul className="ip-list">
                  {license.machines.map((machine) => (
                    <li key={machine.id} className="ip-item">
                      <code>{machine.fingerprint}</code>
                      {machine.ip && (
                        <span className="account-muted">{machine.ip}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="account-muted">No devices bound to this license.</p>
              )}

              {/* Reset flow */}
              {license.machines.length > 0 && !showConfirm && (
                <button
                  className="btn btn-danger"
                  onClick={() => setShowConfirm(true)}
                >
                  Reset Devices
                </button>
              )}
              {showConfirm && (
                <div className="confirm-box">
                  <p>Are you sure? This will deactivate all devices on your license.</p>
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