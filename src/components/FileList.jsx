import { useState, useEffect, useCallback } from 'react';
import { list, remove, getUrl, uploadData } from 'aws-amplify/storage';
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
    FiFolderPlus,
    FiEye,
    FiShare2,
    FiChevronRight,
    FiHome,
    FiArrowLeft,
} from 'react-icons/fi';
import {
    STORAGE_ACCESS_LEVEL,
    IMAGE_EXTENSIONS,
    VIDEO_EXTENSIONS,
    AUDIO_EXTENSIONS,
    PDF_EXTENSIONS,
    CODE_EXTENSIONS,
    DOC_EXTENSIONS,
    FOLDER_PLACEHOLDER,
} from '../constants';
import FilePreview from './FilePreview';
import FileShare from './FileShare';
import './FileList.css';

function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
    if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
    if (AUDIO_EXTENSIONS.includes(ext)) return 'audio';
    if (PDF_EXTENSIONS.includes(ext)) return 'document';
    if (DOC_EXTENSIONS.includes(ext)) return 'document';
    if (CODE_EXTENSIONS.includes(ext)) return 'code';
    return 'other';
}

function getFileIcon(type) {
    switch (type) {
        case 'image': return <FiImage />;
        case 'document': return <FiFileText />;
        case 'video': return <FiFilm />;
        case 'audio': return <FiFilm />;
        case 'code': return <FiCode />;
        default: return <FiFile />;
    }
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '—';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function parseItems(rawItems, currentPrefix) {
    const folderSet = new Set();
    const directFiles = [];

    for (const item of rawItems) {
        const key = item.key;
        if (!key.startsWith(currentPrefix)) continue;

        const relative = key.slice(currentPrefix.length);
        if (!relative) continue;
        if (relative === FOLDER_PLACEHOLDER) continue;

        const slashIdx = relative.indexOf('/');
        if (slashIdx === -1) {
            directFiles.push({
                key,
                name: relative,
                size: item.size,
                lastModified: item.lastModified,
                type: getFileType(relative),
            });
        } else {
            folderSet.add(relative.slice(0, slashIdx));
        }
    }

    const folders = Array.from(folderSet).map((name) => ({
        key: currentPrefix + name + '/',
        name,
        isFolder: true,
    }));

    return { folders, files: directFiles };
}

function FileList({ onShowVersions, refreshTrigger, onToast, onFilesLoaded, onFolderChange }) {
    const [rawItems, setRawItems] = useState([]);
    const [currentPrefix, setCurrentPrefix] = useState('');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [savingFolder, setSavingFolder] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [shareFile, setShareFile] = useState(null);

    const breadcrumbs = currentPrefix
        ? currentPrefix.slice(0, -1).split('/')
        : [];

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const result = await list({
                prefix: '',
                options: { accessLevel: STORAGE_ACCESS_LEVEL, listAll: true },
            });
            const items = (result.items || []).filter((i) => i.key && i.key.length > 0);
            setRawItems(items);
            onFilesLoaded?.(items);
        } catch (err) {
            console.error('Error listing files:', err);
            onToast?.('Failed to load files', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [refreshTrigger]);

    useEffect(() => { onFolderChange?.(currentPrefix); }, [currentPrefix]);

    const { folders, files } = parseItems(rawItems, currentPrefix);

    const displayFolders = search ? [] : folders;
    const displayFiles = search
        ? rawItems
            .filter((i) => i.key && !i.key.endsWith(FOLDER_PLACEHOLDER))
            .filter((i) => i.key.toLowerCase().includes(search.toLowerCase()))
            .map((i) => ({
                key: i.key, name: i.key, size: i.size,
                lastModified: i.lastModified, type: getFileType(i.key),
            }))
        : files;

    const openFolder = (folderKey) => { setSearch(''); setCurrentPrefix(folderKey); };

    const navigateTo = (idx) => {
        setSearch('');
        if (idx < 0) { setCurrentPrefix(''); return; }
        const parts = breadcrumbs.slice(0, idx + 1);
        setCurrentPrefix(parts.join('/') + '/');
    };

    const handleCreateFolder = async () => {
        const trimmed = newFolderName.trim();
        if (!trimmed) { onToast?.('Folder name cannot be empty', 'error'); return; }
        if (/[/\\]/.test(trimmed)) { onToast?.('Folder name cannot contain slashes', 'error'); return; }
        setSavingFolder(true);
        try {
            const placeholderKey = currentPrefix + trimmed + '/' + FOLDER_PLACEHOLDER;
            await uploadData({
                key: placeholderKey,
                data: new Blob([''], { type: 'text/plain' }),
                options: { accessLevel: STORAGE_ACCESS_LEVEL },
            }).result;
            setNewFolderName('');
            setCreatingFolder(false);
            onToast?.(`Folder "${trimmed}" created`, 'success');
            fetchAll();
        } catch (err) {
            console.error('Create folder error:', err);
            onToast?.('Failed to create folder', 'error');
        } finally {
            setSavingFolder(false);
        }
    };

    const handleDownload = async (file) => {
        try {
            const urlResult = await getUrl({
                key: file.key,
                options: { accessLevel: STORAGE_ACCESS_LEVEL, expiresIn: 3600 },
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
            await remove({ key: file.key, options: { accessLevel: STORAGE_ACCESS_LEVEL } });
            setRawItems((prev) => prev.filter((i) => i.key !== file.key));
            onToast?.(`"${file.name}" deleted`, 'success');
        } catch (err) {
            console.error('Delete error:', err);
            onToast?.('Failed to delete file', 'error');
        }
    };

    const handleDeleteFolder = async (folder) => {
        if (!window.confirm(`Delete folder "${folder.name}" and ALL its contents? This cannot be undone.`)) return;
        try {
            const toDelete = rawItems.filter((i) => i.key.startsWith(folder.key));
            await Promise.all(
                toDelete.map((i) => remove({ key: i.key, options: { accessLevel: STORAGE_ACCESS_LEVEL } }))
            );
            setRawItems((prev) => prev.filter((i) => !i.key.startsWith(folder.key)));
            onToast?.(`Folder "${folder.name}" deleted`, 'success');
        } catch (err) {
            console.error('Delete folder error:', err);
            onToast?.('Failed to delete folder', 'error');
        }
    };

    return (
        <>
            <div className="file-list-section">
                <div className="file-list-header">
                    <div className="file-list-title-row">
                        <h2>
                            <FiFolder /> Files
                            {(displayFolders.length + displayFiles.length) > 0 && (
                                <span className="file-list-count">
                                    {displayFolders.length + displayFiles.length}
                                </span>
                            )}
                        </h2>
                        <button
                            className="folder-create-btn"
                            onClick={() => setCreatingFolder(true)}
                            title="New folder"
                        >
                            <FiFolderPlus /> New folder
                        </button>
                    </div>

                    <nav className="breadcrumb">
                        <button
                            className={`breadcrumb-item ${currentPrefix === '' ? 'active' : ''}`}
                            onClick={() => navigateTo(-1)}
                        >
                            <FiHome /> Home
                        </button>
                        {breadcrumbs.map((crumb, idx) => (
                            <span key={idx} className="breadcrumb-group">
                                <FiChevronRight className="breadcrumb-sep" />
                                <button
                                    className={`breadcrumb-item ${idx === breadcrumbs.length - 1 ? 'active' : ''}`}
                                    onClick={() => navigateTo(idx)}
                                >
                                    {crumb}
                                </button>
                            </span>
                        ))}
                    </nav>

                    <div className="file-list-search">
                        <FiSearch className="file-list-search-icon" />
                        <input
                            type="text"
                            placeholder="Search all files…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {creatingFolder && (
                    <div className="new-folder-bar glass">
                        <FiFolder className="new-folder-icon" />
                        <input
                            type="text"
                            className="new-folder-input"
                            placeholder="Folder name…"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateFolder();
                                if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); }
                            }}
                            autoFocus
                            maxLength={80}
                        />
                        <button className="new-folder-save" onClick={handleCreateFolder} disabled={savingFolder}>
                            {savingFolder ? '…' : 'Create'}
                        </button>
                        <button className="new-folder-cancel" onClick={() => { setCreatingFolder(false); setNewFolderName(''); }}>
                            Cancel
                        </button>
                    </div>
                )}

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
                ) : (displayFolders.length + displayFiles.length) === 0 ? (
                    <div className="file-table-container glass">
                        <div className="file-list-empty">
                            <div className="file-list-empty-icon"><FiFolder /></div>
                            <h3>{search ? 'No files match your search' : 'This folder is empty'}</h3>
                            <p>
                                {search
                                    ? 'Try a different search term'
                                    : 'Upload files or create a new folder above'}
                            </p>
                            {currentPrefix && !search && (
                                <button className="back-btn" onClick={() => navigateTo(breadcrumbs.length - 2)}>
                                    <FiArrowLeft /> Go back
                                </button>
                            )}
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
                                {displayFolders.map((folder) => (
                                    <tr key={folder.key} className="folder-row" onDoubleClick={() => openFolder(folder.key)}>
                                        <td>
                                            <div className="file-name-cell">
                                                <div className="file-icon folder"><FiFolder /></div>
                                                <button className="folder-name-btn" onClick={() => openFolder(folder.key)}>
                                                    {folder.name}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="file-size">—</td>
                                        <td className="file-date">—</td>
                                        <td>
                                            <div className="file-actions">
                                                <button className="file-action-btn open" title="Open" onClick={() => openFolder(folder.key)}><FiFolder /></button>
                                                <button className="file-action-btn delete" title="Delete" onClick={() => handleDeleteFolder(folder)}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {displayFiles.map((file) => (
                                    <tr key={file.key}>
                                        <td>
                                            <div className="file-name-cell">
                                                <div className={`file-icon ${file.type}`}>{getFileIcon(file.type)}</div>
                                                <span className="file-name-text" title={file.key}>{file.name}</span>
                                            </div>
                                        </td>
                                        <td className="file-size">{formatFileSize(file.size)}</td>
                                        <td className="file-date">{formatDate(file.lastModified)}</td>
                                        <td>
                                            <div className="file-actions">
                                                <button className="file-action-btn preview" title="Preview" onClick={() => setPreviewFile(file)}><FiEye /></button>
                                                <button className="file-action-btn share" title="Share" onClick={() => setShareFile(file)}><FiShare2 /></button>
                                                <button className="file-action-btn download" title="Download" onClick={() => handleDownload(file)}><FiDownload /></button>
                                                <button className="file-action-btn versions" title="Versions" onClick={() => onShowVersions?.(file)}><FiClock /></button>
                                                <button className="file-action-btn delete" title="Delete" onClick={() => handleDelete(file)}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {previewFile && (
                <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} onToast={onToast} />
            )}
            {shareFile && (
                <FileShare file={shareFile} onClose={() => setShareFile(null)} onToast={onToast} />
            )}
        </>
    );
}

export default FileList;
