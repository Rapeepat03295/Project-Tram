import '../components/AdminLogin.css'
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';


const AdminLogin = () => {
    const navigate = useNavigate();
    const [isLoginVisible, setLoginVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [user, setUser] = useState(null);
    const [password, setPassword] = useState('');
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if(currentUser)
                setUser(currentUser);
        });
        return () => unsubscribe();
    }, [auth]);



    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log(userCredential);
            setUser(userCredential.user);
            setLoginVisible(false);
        } catch (error) {
            setUser(null);
            console.log(error);
            alert("Login unsuccesful");
        }
    }
    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null); // Clear the user state
            setLoginVisible(false);
        } catch (error) {
            console.log(error);
            setIsLogin(false);
            console.error('Error signing out:', error);
        }
    };
    const toggleLogin = () => {
        setLoginVisible(!isLoginVisible);
    }

    const handleDashboardAccess = () => {
        navigate('/admin-event');
    };

    return (
        <div className="admin-login-con">
            <svg xmlns="http://www.w3.org/2000/svg" onClick={() => toggleLogin()} className="admin-login-btn blue-color-logo" viewBox="0 0 448 512">
                <path d="M96 128a128 128 0 1 0 256 0A128 128 0 1 0 96 128zm94.5 200.2l18.6 31L175.8 483.1l-36-146.9c-2-8.1-9.8-13.4-17.9-11.3C51.9 342.4 0 405.8 0 481.3c0 17 13.8 30.7 30.7 30.7l131.7 0c0 0 0 0 .1 0l5.5 0 112 0 5.5 0c0 0 0 0 .1 0l131.7 0c17 0 30.7-13.8 30.7-30.7c0-75.5-51.9-138.9-121.9-156.4c-8.1-2-15.9 3.3-17.9 11.3l-36 146.9L238.9 359.2l18.6-31c6.4-10.7-1.3-24.2-13.7-24.2L224 304l-19.7 0c-12.4 0-20.1 13.6-13.7 24.2z" /></svg>
            {user && <button className="admin-btn" onClick={() => handleDashboardAccess()}>Access Dashboard</button>}
            {isLoginVisible && !user &&
                <div className='admin-form'>
                    <label for="email" className="login-label">Email</label>
                    <input type="text" id="email" className="login-input" value={email} onChange={(e) => setEmail(e.target.value)}></input>
                    <label for="password" className="login-label">Password</label>
                    <input type="password" id="password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)}></input>
                    <button className="login-btn theme-color" onClick={() => handleLogin()}>Login</button>
                </div>
            }
            {isLoginVisible && user &&
                <div className='show-logout'>
                    <button className="logout-btn" onClick={() => handleLogout()}>Logout</button>
                </div>
            }
        </div>
    )
}

export default AdminLogin