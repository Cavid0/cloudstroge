import { useState, useEffect } from 'react';
import { FiX, FiDownload, FiClock } from 'react-icons/fi';
import awsExports from '../aws-exports';
import './FileVersions.css';

const API_ENDPOINT = (awsExports.aws_cloud_logic_custom?.[0]?.endpoint || '');

function FileVersions({ file, onClose }) {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '—';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    useEffect(() => {
        const fetchVersions = async () => {
            setLoading(true);
            try {
                if (API_ENDPOINT) {
                    const response = await fetch(
                        `${API_ENDPOINT}/files/versions?key=${encodeURIComponent(file.key)}`,
                        { headers: { 'Content-Type': 'application/json' } }
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setVersions(data.versions || []);
                    } else {
                        throw new Error('API error');
                    }
                } else {
                    setVersions([
                        {
                            versionId: 'current',
                            lastModified: file.lastModified || new Date().toISOString(),
                            size: file.size,
                            isLatest: true,
                        },
                    ]);
                }
            } catch (err) {
                console.error('Error fetching versions:', err);
                setVersions([
                    {
                        versionId: 'current',
                        lastModified: file.lastModified || new Date().toISOString(),
                        size: file.size,
                        isLatest: true,
                    },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchVersions();
    }, [file]);

    const handleDownloadVersion = async (version) => {
        try {
            if (API_ENDPOINT) {
                const response = await fetch(
                    `${API_ENDPOINT}/files/versions/download?key=${encodeURIComponent(file.key)}&versionId=${encodeURIComponent(version.versionId)}`,
                    { headers: { 'Content-Type': 'application/json' } }
                );
                if (response.ok) {
                    const data = await response.json();
                    if (data.url) {
                        window.open(data.url, '_blank');
                    }
                }
            }
        } catch (err) {
            console.error('Error downloading version:', err);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="versions-overlay" onClick={handleOverlayClick}>
            <div className="versions-modal glass">
                <div className="versions-header">
                    <div className="versions-header-info">
                        <div className="versions-header-icon">
                            <FiClock />
                        </div>
                        <div>
                            <h3>Version History</h3>
                            <p>{file.name}</p>
                        </div>
                    </div>
                    <button className="versions-close" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <div className="versions-body">
                    {loading ? (
                        <div className="versions-loading">
                            <div className="spinner"></div>
                            <p>Loading versions...</p>
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="versions-empty">
                            <p>No version history available</p>
                        </div>
                    ) : (
                        versions.map((version, index) => (
                            <div
                                key={version.versionId}
                                className={`version-item ${version.isLatest ? 'latest' : ''}`}
                            >
                                <div className="version-number">
                                    {versions.length - index}
                                </div>
                                <div className="version-info">
                                    <div className="version-date">
                                        {formatDate(version.lastModified)}
                                        {version.isLatest && (
                                            <span className="version-badge">Latest</span>
                                        )}
                                    </div>
                                    <div className="version-meta">
                                        <span>{formatFileSize(version.size)}</span>
                                        <span>ID: {version.versionId.substring(0, 12)}...</span>
                                    </div>
                                </div>
                                <button
                                    className="version-download-btn"
                                    onClick={() => handleDownloadVersion(version)}
                                >
                                    <FiDownload />
                                    Download
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default FileVersions;
