import { useEffect, useState } from 'react';
import { getUrl } from 'aws-amplify/storage';
import { FiX, FiDownload, FiExternalLink } from 'react-icons/fi';
import {
  STORAGE_ACCESS_LEVEL,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
  PDF_EXTENSIONS,
  TEXT_EXTENSIONS,
} from '../constants';
import './FilePreview.css';

function getPreviewType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio';
  if (PDF_EXTENSIONS.includes(ext))   return 'pdf';
  if (TEXT_EXTENSIONS.includes(ext))  return 'text';
  return 'unsupported';
}

function FilePreview({ file, onClose, onToast }) {
  const [url, setUrl]         = useState('');
  const [text, setText]       = useState('');
  const [loading, setLoading] = useState(true);

  const type = getPreviewType(file.name);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await getUrl({
          key: file.key,
          options: {
            accessLevel: STORAGE_ACCESS_LEVEL,
            expiresIn: 3600,
          },
        });
        const href = result.url.toString();
        setUrl(href);

        if (type === 'text') {
          const res = await fetch(href);
          const txt = await res.text();
          setText(txt);
        }
      } catch (err) {
        console.error('Preview error:', err);
        onToast?.('Failed to load preview', 'error');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [file.key]);

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="preview-overlay" onClick={handleOverlay}>
      <div className="preview-modal glass">
        {/* Header */}
        <div className="preview-header">
          <span className="preview-filename" title={file.name}>{file.name}</span>
          <div className="preview-header-actions">
            <a
              href={url}
              download={file.name}
              className="preview-action-btn"
              title="Download"
              onClick={(e) => !url && e.preventDefault()}
            >
              <FiDownload />
            </a>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="preview-action-btn"
              title="Open in new tab"
              onClick={(e) => !url && e.preventDefault()}
            >
              <FiExternalLink />
            </a>
            <button className="preview-close-btn" onClick={onClose} title="Close">
              <FiX />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="preview-body">
          {loading ? (
            <div className="preview-loader">
              <div className="spinner"></div>
              <p>Loading preview…</p>
            </div>
          ) : type === 'image' ? (
            <img src={url} alt={file.name} className="preview-image" />
          ) : type === 'video' ? (
            <video controls className="preview-video">
              <source src={url} />
              Your browser does not support the video tag.
            </video>
          ) : type === 'audio' ? (
            <div className="preview-audio-wrapper">
              <audio controls className="preview-audio">
                <source src={url} />
              </audio>
            </div>
          ) : type === 'pdf' ? (
            <iframe
              src={url}
              title={file.name}
              className="preview-pdf"
            />
          ) : type === 'text' ? (
            <pre className="preview-text">{text}</pre>
          ) : (
            <div className="preview-unsupported">
              <p>Preview not available for this file type.</p>
              <a
                href={url}
                download={file.name}
                className="preview-download-link"
              >
                <FiDownload /> Download file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FilePreview;
