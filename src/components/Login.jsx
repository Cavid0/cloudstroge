import { useState } from 'react';
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';
import { FiMail, FiLock, FiUser, FiBox } from 'react-icons/fi';
import './Login.css';

function Login({ onLoginSuccess }) {
    const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'confirm'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmCode, setConfirmCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signIn({ username: email, password });
            onLoginSuccess();
        } catch (err) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email,
                        name,
                    },
                },
            });
            setMode('confirm');
        } catch (err) {
            setError(err.message || 'Failed to sign up');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await confirmSignUp({ username: email, confirmationCode: confirmCode });
            // Auto sign-in after confirmation
            await signIn({ username: email, password });
            onLoginSuccess();
        } catch (err) {
            setError(err.message || 'Failed to confirm');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-bg-orb"></div>
            <div className="login-bg-orb"></div>
            <div className="login-bg-orb"></div>

            <div className="login-card glass">
                <div className="login-logo">
                    <div className="login-logo-icon">
                        <FiBox />
                    </div>
                    <h1>BlackDropbox</h1>
                    <p>Serverless file storage in the cloud</p>
                </div>

                {mode !== 'confirm' && (
                    <div className="login-tabs">
                        <button
                            className={`login-tab ${mode === 'signin' ? 'active' : ''}`}
                            onClick={() => { setMode('signin'); setError(''); }}
                        >
                            Sign In
                        </button>
                        <button
                            className={`login-tab ${mode === 'signup' ? 'active' : ''}`}
                            onClick={() => { setMode('signup'); setError(''); }}
                        >
                            Sign Up
                        </button>
                    </div>
                )}

                {error && <div className="login-error">{error}</div>}

                {mode === 'signin' && (
                    <form className="login-form" onSubmit={handleSignIn}>
                        <div className="form-group">
                            <label>Email</label>
                            <div className="form-input-wrapper">
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <FiMail className="form-input-icon" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <div className="form-input-wrapper">
                                <input
                                    className="form-input"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <FiLock className="form-input-icon" />
                            </div>
                        </div>
                        <button className="login-btn" type="submit" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Sign In'}
                        </button>
                    </form>
                )}

                {mode === 'signup' && (
                    <form className="login-form" onSubmit={handleSignUp}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <div className="form-input-wrapper">
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <FiUser className="form-input-icon" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <div className="form-input-wrapper">
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <FiMail className="form-input-icon" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <div className="form-input-wrapper">
                                <input
                                    className="form-input"
                                    type="password"
                                    placeholder="Min 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                                <FiLock className="form-input-icon" />
                            </div>
                        </div>
                        <button className="login-btn" type="submit" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Create Account'}
                        </button>
                    </form>
                )}

                {mode === 'confirm' && (
                    <form className="login-form" onSubmit={handleConfirm}>
                        <div className="confirmation-info">
                            A confirmation code has been sent to <strong>{email}</strong>. Please enter it below.
                        </div>
                        <div className="form-group">
                            <label>Confirmation Code</label>
                            <div className="form-input-wrapper">
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Enter 6-digit code"
                                    value={confirmCode}
                                    onChange={(e) => setConfirmCode(e.target.value)}
                                    required
                                />
                                <FiLock className="form-input-icon" />
                            </div>
                        </div>
                        <button className="login-btn" type="submit" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Confirm & Sign In'}
                        </button>
                    </form>
                )}

                {mode !== 'confirm' && (
                    <div className="login-footer">
                        {mode === 'signin' ? (
                            <p>
                                Don&apos;t have an account?{' '}
                                <button onClick={() => { setMode('signup'); setError(''); }}>Sign up</button>
                            </p>
                        ) : (
                            <p>
                                Already have an account?{' '}
                                <button onClick={() => { setMode('signin'); setError(''); }}>Sign in</button>
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Login;
