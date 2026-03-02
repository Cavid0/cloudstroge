import { signOut } from 'aws-amplify/auth';
import { Link, useLocation } from 'react-router-dom';
import { FiBox, FiLogOut, FiHome, FiUser } from 'react-icons/fi';
import './Navbar.css';

function Navbar({ user, onSignOut }) {
    const location = useLocation();

    const handleSignOut = async () => {
        try {
            await signOut();
            onSignOut();
        } catch (err) {
            console.error('Error signing out:', err);
        }
    };

    const getInitials = () => {
        if (!user) return '?';
        const email = user.signInDetails?.loginId || user.username || '';
        return email.charAt(0).toUpperCase();
    };

    return (
        <nav className="navbar glass">
            <div className="navbar-brand">
                <div className="navbar-brand-icon">
                    <FiBox />
                </div>
                <h2>BlackDropbox</h2>
            </div>

            <div className="navbar-links">
                <Link
                    to="/"
                    className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                    <FiHome />
                    <span>Files</span>
                </Link>
                <Link
                    to="/profile"
                    className={`navbar-link ${location.pathname === '/profile' ? 'active' : ''}`}
                >
                    <FiUser />
                    <span>Profile</span>
                </Link>
            </div>

            <div className="navbar-right">
                <div className="navbar-user">
                    <div className="navbar-user-avatar">{getInitials()}</div>
                    <span>{user?.signInDetails?.loginId || user?.username || 'User'}</span>
                </div>
                <button className="navbar-signout" onClick={handleSignOut}>
                    <FiLogOut />
                    <span>Sign Out</span>
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
