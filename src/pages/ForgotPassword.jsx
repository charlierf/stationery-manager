import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiPost } from '@/lib/utils'; // Assuming you'll use this

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // Use apiPost or direct fetch to your backend endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/reset-password`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (!response.ok) {
         throw new Error(data.error || 'Erro ao solicitar recuperação de senha');
      }

      setMessage(data.message || 'Instruções enviadas para seu e-mail.');
      toast({ title: 'Verifique seu e-mail', description: data.message });
    } catch (err) {
      // Display a generic message even on error for security
      setMessage('Se o email estiver cadastrado, um link de recuperação foi enviado.');
      toast({ title: 'Verifique seu e-mail', description: 'Se o email estiver cadastrado, um link de recuperação foi enviado.', variant: 'default' });
      console.error("Reset Password Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-center">Recuperar Senha</CardTitle>
        </CardHeader>
        <CardContent>
          {message && <div className="text-green-600 text-center mb-4">{message}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-center text-gray-600">Digite seu e-mail para receber instruções de como redefinir sua senha.</p>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Instruções'}
            </Button>
            <div className="text-center text-sm">
              <Link to="/login" className="underline text-blue-600 hover:text-blue-800">
                Voltar para Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;