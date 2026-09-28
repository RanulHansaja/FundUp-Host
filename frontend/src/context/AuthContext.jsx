import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(() => {
        const storedUser = localStorage.getItem('currentUser');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const login = (userData) => {
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        if (userData.userID) {
            localStorage.setItem('userID', userData.userID);
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userID');
    };

    const updateProfilePhoto = (photoUrl) => {
        if (currentUser) {
            const updatedUser = { ...currentUser, profilePhoto: photoUrl };
            setCurrentUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
    };

    const updateProfileDetails = (details) => {
        if (currentUser) {
            const updatedUser = { ...currentUser, ...details };
            setCurrentUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
    };

    const value = {
        currentUser,
        login,
        logout,
        updateProfilePhoto,
        updateProfileDetails
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
