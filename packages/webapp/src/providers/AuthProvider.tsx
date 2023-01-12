import React, {
  createContext,
  useEffect,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';

interface AuthContext {
  login: () => void;
  logout: () => void;
  jwt?: string;
  user?: User | null;
}

const AuthContext = createContext<AuthContext>({} as AuthContext);

function parseJwt(token: string): User {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

  return JSON.parse(jsonPayload);
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [jwt, setJWT] = useState<string | undefined>(
    localStorage.getItem('jwt') || undefined
  );
  const user = useMemo(() => (jwt ? parseJwt(jwt) : undefined), [jwt]);
  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const login = useCallback(() => {
    const redirectUri = window.location.href;
    localStorage.setItem('redirectUri', redirectUri);
    const query = new URLSearchParams({
      redirect_uri: redirectUri,
    });
    window.location.href = `http://10.0.0.234:8080/auth/wca?${query.toString()}`;
  }, [location]);

  const logout = useCallback(() => {
    setJWT(undefined);
    localStorage.removeItem('jwt');
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    console.log(60, user);
    if (new Date(user?.exp * 1000).getTime() < Date.now()) {
      console.log(62, 'token expired');
      fetch('http://10.0.0.234:8080/auth/wca/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });
    }
  }, [user]);

  useEffect(() => {
    if (!query) {
      return;
    }

    const code = query.get('code');

    if (code) {
      const queryString = new URLSearchParams({
        code,
        redirect_uri:
          localStorage.getItem('redirectUri') || window.location.href,
      });
      navigate(location.pathname);

      fetch(
        `http://10.0.0.234:8080/auth/wca/callback?${queryString.toString()}`
      )
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to authenticate');
          }

          return res.json();
        })
        .then((data) => {
          console.log('Data', data);
          setJWT(data.jwt);
          localStorage.setItem('jwt', data.jwt);
        });
    }
  }, [query]);

  return (
    <AuthContext.Provider value={{ jwt, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;

export const useAuth = () => useContext(AuthContext);