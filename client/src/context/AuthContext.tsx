import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { User, Organization } from '../types';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, org?: Organization) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const defaultDemoUser: User = {
  id: 'demo-user-1',
  name: 'Tosif Raza',
  email: 'tosif@rizassociates.com',
  role: 'CA Admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  status: 'active',
};

const defaultDemoOrg: Organization = {
  id: 'demo-org-1',
  name: 'RIZ & Associates',
  settings: {
    defaultFinancialYear: '2026-27',
    defaultTheme: 'light',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ca_proflow_user');
    return saved ? JSON.parse(saved) : defaultDemoUser;
  });
  const [organization, setOrganization] = useState<Organization | null>(() => {
    const saved = localStorage.getItem('ca_proflow_org');
    return saved ? JSON.parse(saved) : defaultDemoOrg;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.data) {
        const u = res.data.data.user;
        const o = res.data.data.organization;
        setUser(u);
        setOrganization(o);
        localStorage.setItem('ca_proflow_user', JSON.stringify(u));
        localStorage.setItem('ca_proflow_org', JSON.stringify(o));
      }
    } catch (e) {
      // If server unreachable, retain demo user
      if (!user) {
        setUser(defaultDemoUser);
        setOrganization(defaultDemoOrg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const autoAuthenticateDemo = async () => {
    try {
      const res = await api.post('/auth/login', {
        email: 'tosif@rizassociates.com',
        password: 'Password123!',
      });
      if (res.data?.data?.token) {
        const { token, user: u, organization: org } = res.data.data;
        localStorage.setItem('ca_proflow_token', token);
        localStorage.setItem('ca_proflow_user', JSON.stringify(u));
        if (org) {
          localStorage.setItem('ca_proflow_org', JSON.stringify(org));
          setOrganization(org);
        }
        setUser(u);
      }
    } catch (err) {
      console.warn('Auto demo login fallback failed', err);
      setUser(defaultDemoUser);
      setOrganization(defaultDemoOrg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('ca_proflow_token');
    if (token) {
      refreshUser();
    } else {
      autoAuthenticateDemo();
    }
  }, []);

  const login = (token: string, u: User, org?: Organization) => {
    localStorage.setItem('ca_proflow_token', token);
    localStorage.setItem('ca_proflow_user', JSON.stringify(u));
    if (org) {
      localStorage.setItem('ca_proflow_org', JSON.stringify(org));
      setOrganization(org);
    }
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('ca_proflow_token');
    localStorage.removeItem('ca_proflow_user');
    localStorage.removeItem('ca_proflow_org');
    setUser(null);
    setOrganization(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
