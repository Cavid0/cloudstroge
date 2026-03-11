import { useState, useEffect } from 'react';
import { FiDownload, FiAlertTriangle, FiClock, FiShield, FiBox } from 'react-icons/fi';
import './SharedFileView.css';

function decryptShareToken(token) {
  try {
    const restored = token.replace(/-/g, '+').replace(/_/g, '/');
    const unshuffled = restored.split('').reverse().join('');
    const padded = unshuffled + '='.repeat((4 - (unshuffled.length % 4)) % 4);
    const decoded = decodeURIComponent(escape(atob(padded)));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function SharedFileView() {
  const [status, setStatus] = useState('loading');
  const [fileUrl, setFileUrl] = useState('');
  const [expiry, setExpiry] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    const token = path.replace('/share/', '');

    if (!token) {
      setStatus('invalid');
      return;
    }

    const payload = decryptShareToken(token);
    if (!payload || !payload.u) {
      setStatus('invalid');
      return;
    }

    if (payload.e && Date.now() > payload.e) {
      setStatus('expired');
      setExpiry(new Date(payload.e));
      return;
    }

    setFileUrl(payload.u);
    setExpiry(payload.e ? new Date(payload.e) : null);
    setStatus('ready');
  }, []);

  if (status === 'loading') {
    return (
      <div className="shared-view">
        <div className="shared-card glass">
          <div className="shared-spinner" />
          <p>Decrypting link…</p>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="shared-view">
        <div className="shared-card glass">
          <div className="shared-icon error">
            <FiAlertTriangle />
          </div>
          <h2>Invalid Link</h2>
          <p>This share link is invalid or has been corrupted.</p>
          <a href="/" className="shared-home-btn">Go to BlackDropbox</a>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="shared-view">
        <div className="shared-card glass">
          <div className="shared-icon expired">
            <FiClock />
          </div>
          <h2>Link Expired</h2>
          <p>
            This share link expired on{' '}
            <strong>
              {expiry?.toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </strong>.
          </p>
          <a href="/" className="shared-home-btn">Go to BlackDropbox</a>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-view">
      <div className="shared-card glass ready">
        <div className="shared-brand">
          <div className="shared-brand-icon"><FiBox /></div>
          <h3>BlackDropbox</h3>
        </div>

        <div className="shared-icon success">
          <FiShield />
        </div>
        <h2>Shared File</h2>
        <p className="shared-description">
          Someone shared a file with you via an encrypted link.
        </p>

        {expiry && (
          <div className="shared-expiry">
            <FiClock />
            <span>
              Expires: {expiry.toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
        )}

        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shared-download-btn"
        >
          <FiDownload />
          Download File
        </a>
      </div>
    </div>
  );
}

export default SharedFileView;
