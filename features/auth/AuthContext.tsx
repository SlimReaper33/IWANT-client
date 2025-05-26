// src/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, register as registerApi, refreshAccessToken } from '../../utils/auth';

interface JwtPayload {
  exp: number;
  role?: string;
}

interface AuthContextType {
  userToken:    string | null;
  refreshToken: string | null;
  userRole:     string | null;
  userEmail:    string | null;
  loading:      boolean;
  login:        (email: string, password: string) => Promise<boolean>;
  register:     (email: string, password: string, role?: string) => Promise<boolean>;
  logout:       () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64    = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userToken,    setUserToken]    = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [userRole,     setUserRole]     = useState<string | null>(null);
  const [userEmail,    setUserEmail]    = useState<string | null>(null);
  const [loading,      setLoading]      = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token   = await AsyncStorage.getItem('userToken');
      const refresh = await AsyncStorage.getItem('refreshToken');
      let validToken = token;

      if (token) {
        const decoded = decodeJwt(token);
        if (decoded?.role) setUserRole(decoded.role);

        if (decoded && decoded.exp * 1000 < Date.now() && refresh) {
          // accessToken истёк — пробуем обновить
          const newToken = await refreshAccessToken(refresh);
          if (newToken) {
            validToken = newToken;
            const newDecoded = decodeJwt(newToken);
            if (newDecoded?.role) setUserRole(newDecoded.role);
          } else {
            // не удалось обновить
            await AsyncStorage.multiRemove(['userToken', 'refreshToken', 'userEmail']);
            validToken = null;
            setUserRole(null);
          }
        }
      }

      setUserToken(validToken);
      setRefreshToken(refresh || null);
      const storedEmail = await AsyncStorage.getItem('userEmail');
      if (storedEmail) setUserEmail(storedEmail);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await loginApi(email, password);
    // здесь мы проверяем, есть ли у result поле accessToken
    if (!result || typeof result.accessToken !== 'string') {
    return false;
}
    await AsyncStorage.multiSet([
      ['userToken',    result.accessToken],
      ['refreshToken', result.refreshToken],
      ['userEmail',    email],
    ]);

    setUserToken(result.accessToken);
    setRefreshToken(result.refreshToken);
    setUserRole(result.role);
    setUserEmail(email);
    return true;
  };

  const register = async (email: string, password: string, role = 'user'): Promise<boolean> => {
    const { ok } = await registerApi(email, password, role);
    return ok;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['userToken', 'refreshToken', 'userEmail']);
    setUserToken(null);
    setRefreshToken(null);
    setUserRole(null);
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider
      value={{
        userToken,
        refreshToken,
        userRole,
        userEmail,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
