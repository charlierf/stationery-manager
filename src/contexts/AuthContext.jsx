import * as React from "react";

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [token, setToken] = React.useState(() => localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = React.useState(() => localStorage.getItem('refreshToken'));

  const isAuthenticated = !!user;

  React.useEffect(() => {
    console.log("AuthProvider: token", token, "user", user, "loading", loading);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.id, email: payload.email });
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  React.useEffect(() => {
    console.log("AuthProvider: token", token, "user", user, "loading", loading);
  }, [token, user, loading]);

  const login = async ({ email, password }) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao autenticar');
    }
    const data = await res.json();
    setToken(data.accessToken);
    localStorage.setItem('token', data.accessToken);
    setRefreshToken(data.refreshToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
