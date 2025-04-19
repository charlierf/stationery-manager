import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import logo from '/logo.png';

function Login() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await login({ email: credentials.email, password: credentials.password });
      setSuccess("Login realizado com sucesso!");
      navigate("/");
    } catch (err) {
      setError(err.message || "Erro ao fazer login");
      toast({
        title: "Erro",
        description: err.message || "Erro ao fazer login",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <div className="flex flex-col items-center gap-2">
            <img src={logo} alt="Logo" className="h-16 w-16" />
            <CardTitle className="text-center">Login</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="text-red-600 text-center mb-2">{error}</div>}
            {success && <div className="text-green-600 text-center mb-2">{success}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
            <Button type="button" variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => navigate('/signup')}>
              <img src={logo} alt="Logo" className="h-5 w-5" />
              Registrar-se
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
