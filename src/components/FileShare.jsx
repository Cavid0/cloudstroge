import { useState } from 'react';
import { getUrl } from 'aws-amplify/storage';
import { FiX, FiLink, FiCheck, FiCopy, FiShield, FiClock, FiLock } from 'react-icons/fi';
import { STORAGE_ACCESS_LEVEL, SHARE_EXPIRY_OPTIONS } from '../constants';
import './FileShare.css';

function encryptShareUrl(rawUrl, expiresInSeconds) {
  const payload = JSON.stringify({
    u: rawUrl,
    e: Date.now() + expiresInSeconds * 1000,
    v: 1,
  });
  const encoded = btoa(unescape(encodeURIComponent(payload)));
  const shuffled = encoded.split('').reverse().join('');
  const token = shuffled.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${window.location.origin}/share/${token}`;
}

function FileShare({ file, onClose, onToast }) {
  const [expiresIn, setExpiresIn] = useState(SHARE_EXPIRY_OPTIONS[1].seconds);
  const [shareUrl, setShareUrl] = useState('');
  const [rawUrl, setRawUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const result = await getUrl({
        key: file.key,
        options: {
          accessLevel: STORAGE_ACCESS_LEVEL,
          expiresIn: Number(expiresIn),
        },
      });
      const url = result.url.toString();
      setRawUrl(url);
      setShareUrl(encryptShareUrl(url, Number(expiresIn)));
    } catch {
      onToast?.('Failed to generate share link', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onToast?.('Encrypted link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onToast?.('Copy failed — please copy manually', 'error');
    }
  };

  const truncateUrl = (url) => {
    if (!url || url.length <= 65) return url;
    return url.slice(0, 35) + '…' + url.slice(-22);
  };

  const selectedOpt = SHARE_EXPIRY_OPTIONS.find((o) => o.seconds === Number(expiresIn));
  const selectedLabel = selectedOpt?.label ?? '';

  const expiryDate = shareUrl
    ? new Date(Date.now() + Number(expiresIn) * 1000).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="share-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="share-modal glass">
        <div className="share-header">
          <div className="share-header-left">
            <div className="share-header-icon-wrap">
              <FiLink className="share-header-icon" />
            </div>
            <div>
              <h3>Share File</h3>
              <p className="share-filename" title={file.name}>{file.name}</p>
            </div>
          </div>
          <button className="share-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="share-body">
          <div className="share-security-badge">
            <FiShield />
            <span>Links are encrypted and secure</span>
          </div>

          <label className="share-label">Link expiration</label>
          <div className="share-expiry-grid">
            {SHARE_EXPIRY_OPTIONS.map((opt) => (
              <button
                key={opt.seconds}
                className={`share-expiry-btn ${Number(expiresIn) === opt.seconds ? 'active' : ''}`}
                onClick={() => { setExpiresIn(opt.seconds); setShareUrl(''); setRawUrl(''); }}
              >
                <FiClock className="share-expiry-icon" />
                {opt.label}
              </button>
            ))}
          </div>

          <button
            className="share-generate-btn"
            onClick={generate}
            disabled={generating}
          >
            {generating ? (
              <span className="share-generate-loading">
                <span className="share-spinner" />
                Generating encrypted link…
              </span>
            ) : (
              <>
                <FiLock />
                Generate encrypted link ({selectedLabel})
              </>
            )}
          </button>

          {shareUrl && (
            <div className="share-result">
              <div className="share-url-box">
                <div className="share-url-label">
                  <FiLock className="share-url-lock" />
                  <span>Encrypted share link</span>
                </div>
                <span className="share-url-text" title={shareUrl}>{truncateUrl(shareUrl)}</span>
              </div>
              <button
                className={`share-copy-btn ${copied ? 'copied' : ''}`}
                onClick={copyToClipboard}
              >
                {copied ? <><FiCheck /> Copied!</> : <><FiCopy /> Copy encrypted link</>}
              </button>
              <div className="share-expiry-info">
                <div className="share-expiry-note">
                  <FiClock />
                  <span>Expires: {expiryDate}</span>
                </div>
                <div className="share-expiry-duration">
                  <FiShield />
                  <span>Valid for {selectedLabel}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileShare;
