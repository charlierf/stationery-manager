import * as React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Signup from "@/pages/Signup";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

console.log("App carregado");

function PrivateRoute({ children }) {
  const { isAuthenticated, loading, user, token } = useAuth();
  console.log("PrivateRoute:", { isAuthenticated, loading, user, token });
  if (loading) return <div>Carregando autenticação...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
