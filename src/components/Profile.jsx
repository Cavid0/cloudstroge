import { useState, useEffect } from 'react';
import {
  updateUserAttributes,
  updatePassword,
  deleteUser,
  fetchUserAttributes,
} from 'aws-amplify/auth';
import { list, remove } from 'aws-amplify/storage';
import {
  FiUser,
  FiMail,
  FiLock,
  FiAlertTriangle,
  FiSave,
  FiTrash2,
  FiCheck,
} from 'react-icons/fi';
import { STORAGE_ACCESS_LEVEL } from '../constants';
import './Profile.css';

function Profile({ user, onSignOut, onToast, onNameChange }) {
  const [attrs, setAttrs] = useState({ name: '', email: '' });
  const [loadingAttrs, setLoadingAttrs] = useState(true);

  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const [confirmDelete, setConfirmDelete] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deletePhase, setDeletePhase] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoadingAttrs(true);
      try {
        const userAttrs = await fetchUserAttributes();
        const fullName = userAttrs.name || '';
        const email = userAttrs.email || user?.signInDetails?.loginId || '';
        setAttrs({ name: fullName, email });
        setName(fullName);
      } catch (err) {
        console.error('fetchUserAttributes error:', err);
      } finally {
        setLoadingAttrs(false);
      }
    };
    load();
  }, [user]);

  const handleSaveName = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { onToast?.('Name cannot be empty', 'error'); return; }
    setSavingName(true);
    try {
      await updateUserAttributes({ userAttributes: { name: trimmed } });
      setAttrs((prev) => ({ ...prev, name: trimmed }));
      onNameChange?.(trimmed);
      onToast?.('Name updated successfully!', 'success');
    } catch (err) {
      onToast?.(err.message || 'Failed to update name', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handleSavePwd = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (newPwd.length < 8) {
      setPwdError('New password must be at least 8 characters.');
      return;
    }
    setSavingPwd(true);
    try {
      await updatePassword({ oldPassword: oldPwd, newPassword: newPwd });
      onToast?.('Password changed successfully!', 'success');
      setOldPwd('');
      setNewPwd('');
    } catch (err) {
      setPwdError(err.message || 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDelete !== 'DELETE') {
      onToast?.('Please type DELETE to confirm', 'error');
      return;
    }
    setDeleting(true);
    try {
      setDeletePhase('Removing your files…');
      const result = await list({
        prefix: '',
        options: { accessLevel: STORAGE_ACCESS_LEVEL, listAll: true },
      });
      const items = result.items || [];
      await Promise.all(
        items.map((item) =>
          remove({ key: item.key, options: { accessLevel: STORAGE_ACCESS_LEVEL } })
        )
      );

      setDeletePhase('Deleting your account…');
      await deleteUser();

      onToast?.('Account deleted. Goodbye!', 'success');
      onSignOut();
    } catch (err) {
      console.error('Delete account error:', err);
      setDeleting(false);
      setDeletePhase('');
      onToast?.(err.message || 'Failed to delete account', 'error');
    }
  };

  const email = attrs.email || user?.signInDetails?.loginId || '—';

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-hero glass">
          <div className="profile-avatar">
            {(attrs.name || email).charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="profile-display-name">
              {loadingAttrs ? '…' : attrs.name || 'No name set'}
            </h2>
            <p className="profile-email">{email}</p>
          </div>
        </div>

        <section className="profile-section glass">
          <div className="profile-section-header">
            <FiUser className="profile-section-icon" />
            <h3>Edit Profile</h3>
          </div>

          <form onSubmit={handleSaveName} className="profile-form">
            <div className="profile-field">
              <label>Display Name</label>
              <div className="profile-input-wrap">
                <FiUser />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your display name"
                  maxLength={60}
                  required
                />
              </div>
            </div>
            <div className="profile-field">
              <label>Email</label>
              <div className="profile-input-wrap disabled">
                <FiMail />
                <input type="email" value={email} readOnly />
              </div>
              <p className="profile-hint">Email cannot be changed here.</p>
            </div>
            <button
              type="submit"
              className="profile-btn primary"
              disabled={savingName}
            >
              {savingName ? 'Saving…' : <><FiSave /> Save changes</>}
            </button>
          </form>
        </section>

        <section className="profile-section glass">
          <div className="profile-section-header">
            <FiLock className="profile-section-icon" />
            <h3>Change Password</h3>
          </div>

          <form onSubmit={handleSavePwd} className="profile-form">
            <div className="profile-field">
              <label>Current Password</label>
              <div className="profile-input-wrap">
                <FiLock />
                <input
                  type="password"
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            <div className="profile-field">
              <label>New Password</label>
              <div className="profile-input-wrap">
                <FiLock />
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>
            {pwdError && <p className="profile-error">{pwdError}</p>}
            <button
              type="submit"
              className="profile-btn primary"
              disabled={savingPwd}
            >
              {savingPwd ? 'Updating…' : <><FiCheck /> Change password</>}
            </button>
          </form>
        </section>

        <section className="profile-section glass danger">
          <div className="profile-section-header">
            <FiAlertTriangle className="profile-section-icon danger" />
            <h3>Danger Zone</h3>
          </div>

          <p className="profile-danger-warning">
            Deleting your account is <strong>permanent and irreversible</strong>.
            All your uploaded files will be removed from cloud storage.
          </p>

          <div className="profile-field">
            <label>Type <strong>DELETE</strong> to confirm</label>
            <input
              type="text"
              className="profile-confirm-input"
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>

          {deletePhase && (
            <p className="profile-delete-phase">{deletePhase}</p>
          )}

          <button
            className="profile-btn danger"
            onClick={handleDeleteAccount}
            disabled={deleting || confirmDelete !== 'DELETE'}
          >
            {deleting ? deletePhase || 'Processing…' : <><FiTrash2 /> Delete my account &amp; all files</>}
          </button>
        </section>
      </div>
    </div>
  );
}

export default Profile;
