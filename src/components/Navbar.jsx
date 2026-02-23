import { signOut } from 'aws-amplify/auth';
import { FiBox, FiLogOut } from 'react-icons/fi';
import './Navbar.css';

function Navbar({ user, onSignOut }) {
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

    const getDisplayName = () => {
        if (!user) return 'User';
        return user.signInDetails?.loginId || user.username || 'User';
    };

    return (
        <nav className="navbar glass">
            <div className="navbar-brand">
                <div className="navbar-brand-icon">
                    <FiBox />
                </div>
                <h2>BlackDropbox</h2>
            </div>

            <div className="navbar-right">
                <div className="navbar-user">
                    <div className="navbar-user-avatar">{getInitials()}</div>
                    <span>{getDisplayName()}</span>
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
