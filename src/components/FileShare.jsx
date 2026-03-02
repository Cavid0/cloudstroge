import { useState } from 'react';
import { getUrl } from 'aws-amplify/storage';
import { FiX, FiLink, FiCheck, FiCopy } from 'react-icons/fi';
import { STORAGE_ACCESS_LEVEL, SHARE_EXPIRY_OPTIONS } from '../constants';
import './FileShare.css';

function FileShare({ file, onClose, onToast }) {
  const [expiresIn, setExpiresIn]   = useState(SHARE_EXPIRY_OPTIONS[1].seconds); // default 24 h
  const [shareUrl, setShareUrl]     = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied]         = useState(false);

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
      setShareUrl(result.url.toString());
    } catch (err) {
      console.error('Share URL error:', err);
      onToast?.('Failed to generate share link', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onToast?.('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onToast?.('Copy failed — please copy manually', 'error');
    }
  };

  const selectedLabel =
    SHARE_EXPIRY_OPTIONS.find((o) => o.seconds === Number(expiresIn))?.label ?? '';

  return (
    <div className="share-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="share-modal glass">
        {/* Header */}
        <div className="share-header">
          <div className="share-header-left">
            <FiLink className="share-header-icon" />
            <div>
              <h3>Share File</h3>
              <p className="share-filename" title={file.name}>{file.name}</p>
            </div>
          </div>
          <button className="share-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className="share-body">
          <label className="share-label">Link expires after</label>
          <div className="share-expiry-grid">
            {SHARE_EXPIRY_OPTIONS.map((opt) => (
              <button
                key={opt.seconds}
                className={`share-expiry-btn ${Number(expiresIn) === opt.seconds ? 'active' : ''}`}
                onClick={() => { setExpiresIn(opt.seconds); setShareUrl(''); }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            className="share-generate-btn"
            onClick={generate}
            disabled={generating}
          >
            {generating ? 'Generating…' : `Generate link (${selectedLabel})`}
          </button>

          {shareUrl && (
            <div className="share-result">
              <div className="share-url-box">
                <span className="share-url-text">{shareUrl}</span>
              </div>
              <button
                className={`share-copy-btn ${copied ? 'copied' : ''}`}
                onClick={copyToClipboard}
              >
                {copied ? <><FiCheck /> Copied!</> : <><FiCopy /> Copy link</>}
              </button>
              <p className="share-expiry-note">
                ⏱ This link will expire in {selectedLabel}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileShare;
