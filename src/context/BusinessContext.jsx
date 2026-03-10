import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

// eslint-disable-next-line react-refresh/only-export-components
export const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchBusiness = async () => {
            if (user) {
                try {
                    // The me route returns both user and business
                    const res = await axios.get('https://billing-software-backend-production-0456.up.railway.app/api/auth/me');
                    setBusiness(res.data.business);
                } catch (err) {
                    console.error("Failed to load business profile");
                }
            } else {
                setBusiness(null);
            }
            setLoading(false);
        };

        fetchBusiness();
    }, [user]);

    return (
        <BusinessContext.Provider value={{ business, setBusiness, loading }}>
            {children}
        </BusinessContext.Provider>
    );
};
