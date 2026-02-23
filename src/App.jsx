import { useState, useCallback } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import Login from './components/Login';
import Navbar from './components/Navbar';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import FileVersions from './components/FileVersions';
import {
  FiFile,
  FiHardDrive,
  FiUploadCloud,
  FiClock,
} from 'react-icons/fi';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [uploadsToday, setUploadsToday] = useState(0);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: '0 KB',
    uploadsToday: 0,
    versions: 0,
  });

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFilesLoaded = useCallback((files) => {
    const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const today = new Date().toDateString();
    const todayCount = files.filter(
      (f) => f.lastModified && new Date(f.lastModified).toDateString() === today
    ).length;

    setStats({
      totalFiles: files.length,
      totalSize: formatSize(totalBytes),
      uploadsToday: todayCount + uploadsToday,
      versions: files.length,
    });
  }, [uploadsToday]);

  // Check authentication on mount
  useState(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  });

  const handleLoginSuccess = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error getting user:', err);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleUploadComplete = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    setUploadsToday((prev) => prev + 1);
    showToast('File uploaded successfully!', 'success');
  }, []);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleShowVersions = (file) => {
    setSelectedFile(file);
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading BlackDropbox...</p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Authenticated - Dashboard
  return (
    <div className="app">
      <Navbar user={user} onSignOut={handleSignOut} />

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast ${toast.type}`}>
              {toast.message}
            </div>
          ))}
        </div>
      )}

      <main className="app-main">
        <div className="dashboard">
          <div className="dashboard-header">
            <h1>Your Cloud Storage</h1>
            <p>Upload, manage, and version your files securely in the cloud</p>
          </div>

          {/* Stats */}
          <div className="stats-bar">
            <div className="stat-card glass glass-hover">
              <div className="stat-icon"><FiFile /></div>
              <div className="stat-content">
                <h3>{stats.totalFiles}</h3>
                <p>Total Files</p>
              </div>
            </div>
            <div className="stat-card glass glass-hover">
              <div className="stat-icon"><FiHardDrive /></div>
              <div className="stat-content">
                <h3>{stats.totalSize}</h3>
                <p>Storage Used</p>
              </div>
            </div>
            <div className="stat-card glass glass-hover">
              <div className="stat-icon"><FiUploadCloud /></div>
              <div className="stat-content">
                <h3>{stats.uploadsToday}</h3>
                <p>Uploads Today</p>
              </div>
            </div>
            <div className="stat-card glass glass-hover">
              <div className="stat-icon"><FiClock /></div>
              <div className="stat-content">
                <h3>{stats.versions}</h3>
                <p>File Versions</p>
              </div>
            </div>
          </div>

          {/* Upload area */}
          <FileUpload onUploadComplete={handleUploadComplete} />

          {/* File list */}
          <FileList
            onShowVersions={handleShowVersions}
            refreshTrigger={refreshTrigger}
            onToast={showToast}
            onFilesLoaded={handleFilesLoaded}
          />
        </div>
      </main>

      {/* Version history modal */}
      {selectedFile && (
        <FileVersions
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}

export default App;
