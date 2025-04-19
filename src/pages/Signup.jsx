import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Signup = () => {
  const [form, setForm] = React.useState({ email: '', password: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar');
      // Salva tokens e faz login automático
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      await login({ email: form.email, password: form.password });
      setSuccess("Cadastro realizado com sucesso!");
      toast({ title: 'Cadastro realizado', description: 'Bem-vindo!', variant: 'default' });
      navigate('/');
    } catch (err) {
      setError(err.message || "Erro ao cadastrar");
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-center">Cadastro</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-600 text-center mb-2">{error}</div>}
          {success && <div className="text-green-600 text-center mb-2">{success}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;