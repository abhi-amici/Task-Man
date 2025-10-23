
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { msalInstance, loginRequest } from '../services/authConfig';
import { EventType, AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { Role } from '../constants';

interface AuthContextType {
  user: User | null;
  users: User[];
  login: () => void;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNewUserRegistration = async (account: AccountInfo): Promise<User | null> => {
    const email = account.username.toLowerCase();
    const name = account.name || email.split('@')[0];
    let role: Role;

    if (email === 'abhishek@amicikart.com') {
        role = Role.SuperAdmin;
    } else if (email === 'shweta@amicikart.com') {
        role = Role.Admin;
    } else {
        role = Role.Employee;
    }

    const newUser: Omit<User, 'id'> = {
        name: name,
        email: email,
        role: role,
        extension: '', // Default value
        avatarUrl: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/100`, // Default avatar
    };

    try {
        const createdUser = await api.createUser(newUser);
        return createdUser;
    } catch (apiError) {
        console.error("Failed to create new user via API:", apiError);
        return null;
    }
  };

  const fetchUserData = async (account: AccountInfo | null) => {
    if (!account?.username) {
        setError("Could not retrieve user information from Microsoft.");
        setUser(null);
        setUsers([]);
        return;
    }
    
    try {
        let appUser = await api.getUserByEmail(account.username);
        
        if (!appUser) {
            console.log(`User ${account.username} not found in database. Creating new user...`);
            appUser = await handleNewUserRegistration(account);
        }

        if (appUser) {
            setUser(appUser);
            const allUsers = await api.getUsers();
            setUsers(allUsers);
            setError(null);
        } else {
            setError(`Failed to retrieve or create a user profile for ${account.username}. Please contact support.`);
            setUser(null);
            setUsers([]);
            await logout();
        }
    } catch (apiError) {
        console.error("Failed to fetch user data from API:", apiError);
        setError("Failed to load your application profile.");
        setUser(null);
        setUsers([]);
    }
  };

  useEffect(() => {
    let callbackId: string | null = null;

    const initializeAuth = async () => {
        try {
            // 1. Initialize MSAL - This is the critical step.
            await msalInstance.initialize();

            // 2. Add event callback after initialization.
            callbackId = msalInstance.addEventCallback(async (event) => {
              if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
                setLoading(true);
                const payload = event.payload as AuthenticationResult;
                const account = payload.account;
                msalInstance.setActiveAccount(account);
                await fetchUserData(account);
                setLoading(false);
              }
            });

            // 3. Handle redirect promise.
            await msalInstance.handleRedirectPromise();

            // 4. Check for existing accounts.
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                msalInstance.setActiveAccount(accounts[0]);
                await fetchUserData(accounts[0]);
            }
        } catch (err) {
            console.error("MSAL initialization error:", err);
            setError("There was an issue signing you in.");
        } finally {
            setLoading(false);
        }
    };
    
    initializeAuth();

    return () => {
      if (callbackId) {
        msalInstance.removeEventCallback(callbackId);
      }
    };
  }, []);

  const login = () => {
    setLoading(true);
    msalInstance.loginRedirect(loginRequest).catch(e => {
        console.error(e);
        setError("Login failed. Please try again.");
        setLoading(false);
    });
  };

  const logout = async () => {
    await msalInstance.logoutRedirect({
      postLogoutRedirectUri: "/",
    });
    setUser(null);
    setUsers([]);
  };
  
  const value = useMemo(() => ({
    user,
    users,
    login,
    logout,
    loading,
    error
  }), [user, users, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
