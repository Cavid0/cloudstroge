import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

function ProtectedRoute({ children, onAuthFail }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await getCurrentUser();
                setIsAuthenticated(true);
            } catch {
                setIsAuthenticated(false);
                onAuthFail?.();
            }
        };
        checkAuth();
    }, [onAuthFail]);

    if (isAuthenticated === null) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Checking authentication...</p>
            </div>
        );
    }

    return isAuthenticated ? children : null;
}

export default ProtectedRoute;
