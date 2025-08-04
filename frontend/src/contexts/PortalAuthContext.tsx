import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountId: string;
  accountName?: string;
}

interface PortalAuthContextType {
  contact: Contact | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, contact: Contact) => void;
  logout: () => void;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

interface PortalAuthProviderProps {
  children: ReactNode;
}

export const PortalAuthProvider: React.FC<PortalAuthProviderProps> = ({ children }) => {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on load
    const initAuth = async () => {
      const token = localStorage.getItem('portalToken');
      const storedContact = localStorage.getItem('portalContact');
      
      if (token && storedContact) {
        try {
          // Verify token is still valid by making a test request
          const response = await fetch('/api/portal/tasks', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            setContact(JSON.parse(storedContact));
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('portalToken');
            localStorage.removeItem('portalContact');
            setContact(null);
          }
        } catch (error) {
          // Network error or invalid token
          localStorage.removeItem('portalToken');
          localStorage.removeItem('portalContact');
          setContact(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, contactData: Contact) => {
    localStorage.setItem('portalToken', token);
    localStorage.setItem('portalContact', JSON.stringify(contactData));
    setContact(contactData);
  };

  const logout = () => {
    localStorage.removeItem('portalToken');
    localStorage.removeItem('portalContact');
    setContact(null);
  };

  return (
    <PortalAuthContext.Provider
      value={{
        contact,
        isAuthenticated: !!contact,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  );
};

export const usePortalAuth = () => {
  const context = useContext(PortalAuthContext);
  if (context === undefined) {
    throw new Error('usePortalAuth must be used within a PortalAuthProvider');
  }
  return context;
};