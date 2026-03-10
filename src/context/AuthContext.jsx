import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    axios.defaults.headers.common['x-auth-token'] = token;
                    const res = await axios.get('https://bilabiate-sharyl-noncriminally.ngrok-free.dev/api/auth/me');
                    setUser(res.data.user);
                } catch (err) {
                    localStorage.removeItem('token');
                    delete axios.defaults.headers.common['x-auth-token'];
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);
    const login = async (email, password) => {
        const res = await axios.post('https://bilabiate-sharyl-noncriminally.ngrok-free.dev/api/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['x-auth-token'] = res.data.token;
        setUser(res.data.user);
        return res.data;
    };
    const register = async (formData) => {
        const res = await axios.post('https://bilabiate-sharyl-noncriminally.ngrok-free.dev/api/auth/register', formData);
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['x-auth-token'] = res.data.token;
        setUser(res.data.user);
        return res.data;
    };
    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        setUser(null);
    };
    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
