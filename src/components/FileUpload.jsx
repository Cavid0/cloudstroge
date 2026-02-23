import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadData } from 'aws-amplify/storage';
import { FiUploadCloud, FiFile, FiCheck, FiX } from 'react-icons/fi';
import './FileUpload.css';

function FileUpload({ onUploadComplete }) {
    const [uploads, setUploads] = useState([]);

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleUpload = async (file) => {
        const uploadId = Date.now() + '-' + file.name;

        setUploads((prev) => [
            ...prev,
            {
                id: uploadId,
                name: file.name,
                size: file.size,
                progress: 0,
                status: 'uploading',
            },
        ]);

        try {
            // Use 'guest' accessLevel (maps to public/ prefix in S3)
            const result = uploadData({
                key: file.name,
                data: file,
                options: {
                    accessLevel: 'guest',
                    contentType: file.type,
                    onProgress: ({ transferredBytes, totalBytes }) => {
                        const progress = Math.round((transferredBytes / totalBytes) * 100);
                        setUploads((prev) =>
                            prev.map((u) =>
                                u.id === uploadId ? { ...u, progress } : u
                            )
                        );
                    },
                },
            });

            await result.result;

            setUploads((prev) =>
                prev.map((u) =>
                    u.id === uploadId ? { ...u, status: 'complete', progress: 100 } : u
                )
            );

            if (onUploadComplete) {
                onUploadComplete({ key: file.name, name: file.name, size: file.size });
            }

            // Clear completed uploads after 3 seconds
            setTimeout(() => {
                setUploads((prev) => prev.filter((u) => u.id !== uploadId));
            }, 3000);
        } catch (err) {
            console.error('Upload error:', err);
            setUploads((prev) =>
                prev.map((u) =>
                    u.id === uploadId
                        ? { ...u, status: 'error', error: err.message }
                        : u
                )
            );
        }
    };

    const onDrop = useCallback(
        (acceptedFiles) => {
            acceptedFiles.forEach((file) => handleUpload(file));
        },
        []
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
    });

    return (
        <div className="file-upload-section">
            <div
                {...getRootProps()}
                className={`file-upload-dropzone glass ${isDragActive ? 'active' : ''}`}
            >
                <input {...getInputProps()} />
                <div className="file-upload-content">
                    <div className="file-upload-icon">
                        <FiUploadCloud />
                    </div>
                    <h3>
                        {isDragActive ? 'Drop your files here' : 'Upload Files'}
                    </h3>
                    <p>
                        Drag & drop files here, or{' '}
                        <span className="browse-link">browse your computer</span>
                    </p>
                    <p className="file-upload-hint">
                        All file types supported • Files are versioned automatically
                    </p>
                </div>
            </div>

            {uploads.length > 0 && (
                <div className="upload-progress">
                    {uploads.map((upload) => (
                        <div key={upload.id} className="upload-file-item glass">
                            <div className="upload-file-icon">
                                {upload.status === 'complete' ? (
                                    <FiCheck />
                                ) : upload.status === 'error' ? (
                                    <FiX />
                                ) : (
                                    <FiFile />
                                )}
                            </div>
                            <div className="upload-file-info">
                                <div className="upload-file-name">{upload.name}</div>
                                <div className="upload-file-size">
                                    {formatFileSize(upload.size)}
                                </div>
                                {upload.status === 'uploading' && (
                                    <div className="upload-progress-bar">
                                        <div
                                            className="upload-progress-fill"
                                            style={{ width: `${upload.progress}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                            <span className={`upload-file-status ${upload.status}`}>
                                {upload.status === 'uploading'
                                    ? `${upload.progress}%`
                                    : upload.status === 'complete'
                                        ? 'Uploaded'
                                        : 'Failed'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FileUpload;
