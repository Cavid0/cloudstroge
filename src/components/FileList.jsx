import { useState, useEffect } from 'react';
import { list, remove, getUrl } from 'aws-amplify/storage';
import {
    FiSearch,
    FiDownload,
    FiTrash2,
    FiClock,
    FiImage,
    FiFileText,
    FiFilm,
    FiCode,
    FiFile,
    FiFolder,
} from 'react-icons/fi';
import './FileList.css';

function FileList({ onShowVersions, refreshTrigger, onToast, onFilesLoaded }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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
        });
    };

    const getFileType = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];
        const docExts = ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'];
        const videoExts = ['mp4', 'avi', 'mov', 'mkv', 'webm'];
        const codeExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'html', 'css', 'json'];

        if (imageExts.includes(ext)) return 'image';
        if (docExts.includes(ext)) return 'document';
        if (videoExts.includes(ext)) return 'video';
        if (codeExts.includes(ext)) return 'code';
        return 'other';
    };

    const getFileIcon = (type) => {
        switch (type) {
            case 'image': return <FiImage />;
            case 'document': return <FiFileText />;
            case 'video': return <FiFilm />;
            case 'code': return <FiCode />;
            default: return <FiFile />;
        }
    };

    const fetchFiles = async () => {
        setLoading(true);
        try {
            // Use 'guest' accessLevel to match upload location (public/ prefix)
            const result = await list({
                prefix: '',
                options: {
                    accessLevel: 'guest',
                    listAll: true,
                },
            });
            const fileList = (result.items || [])
                .filter((item) => item.key && item.key.length > 0)
                .map((item) => ({
                    key: item.key,
                    name: item.key,
                    size: item.size,
                    lastModified: item.lastModified,
                    type: getFileType(item.key),
                }));
            setFiles(fileList);
            onFilesLoaded?.(fileList);
        } catch (err) {
            console.error('Error listing files:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [refreshTrigger]);

    const handleDownload = async (file) => {
        try {
            const urlResult = await getUrl({
                key: file.key,
                options: {
                    accessLevel: 'guest',
                    expiresIn: 3600,
                },
            });
            window.open(urlResult.url.toString(), '_blank');
            onToast?.('Download started', 'success');
        } catch (err) {
            console.error('Download error:', err);
            onToast?.('Failed to download file', 'error');
        }
    };

    const handleDelete = async (file) => {
        if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
        try {
            await remove({
                key: file.key,
                options: {
                    accessLevel: 'guest',
                },
            });
            setFiles((prev) => prev.filter((f) => f.key !== file.key));
            onToast?.(`"${file.name}" deleted`, 'success');
        } catch (err) {
            console.error('Delete error:', err);
            onToast?.('Failed to delete file', 'error');
        }
    };

    const filteredFiles = files.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="file-list-section">
            <div className="file-list-header">
                <h2>
                    <FiFolder /> Your Files
                    {files.length > 0 && (
                        <span className="file-list-count">{files.length}</span>
                    )}
                </h2>
                <div className="file-list-search">
                    <FiSearch className="file-list-search-icon" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="file-table-container glass">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="file-skeleton">
                            <div className="file-skeleton-icon"></div>
                            <div className="file-skeleton-text"></div>
                            <div className="file-skeleton-text short"></div>
                            <div className="file-skeleton-text short"></div>
                        </div>
                    ))}
                </div>
            ) : filteredFiles.length === 0 ? (
                <div className="file-table-container glass">
                    <div className="file-list-empty">
                        <div className="file-list-empty-icon">
                            <FiFolder />
                        </div>
                        <h3>{search ? 'No files match your search' : 'No files yet'}</h3>
                        <p>
                            {search
                                ? 'Try a different search term'
                                : 'Upload your first file using the dropzone above'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="file-table-container glass">
                    <table className="file-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Size</th>
                                <th>Modified</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFiles.map((file) => (
                                <tr key={file.key}>
                                    <td>
                                        <div className="file-name-cell">
                                            <div className={`file-icon ${file.type}`}>
                                                {getFileIcon(file.type)}
                                            </div>
                                            <span className="file-name-text">{file.name}</span>
                                        </div>
                                    </td>
                                    <td className="file-size">{formatFileSize(file.size)}</td>
                                    <td className="file-date">{formatDate(file.lastModified)}</td>
                                    <td>
                                        <div className="file-actions">
                                            <button
                                                className="file-action-btn download"
                                                title="Download"
                                                onClick={() => handleDownload(file)}
                                            >
                                                <FiDownload />
                                            </button>
                                            <button
                                                className="file-action-btn versions"
                                                title="Version history"
                                                onClick={() => onShowVersions?.(file)}
                                            >
                                                <FiClock />
                                            </button>
                                            <button
                                                className="file-action-btn delete"
                                                title="Delete"
                                                onClick={() => handleDelete(file)}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default FileList;
