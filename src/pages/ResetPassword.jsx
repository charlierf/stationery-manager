import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@supabase/supabase-js'; // Import Supabase client directly for this

// Initialize Supabase client - Ensure these vars are available or configure differently
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);


const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Supabase password recovery redirects include the token in the URL hash.
  // The Supabase JS client automatically handles this if the user lands on this page.
  // We just need to call updateUser.

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        throw updateError;
      }

      setMessage('Senha atualizada com sucesso! Redirecionando para login...');
      toast({ title: 'Sucesso', description: 'Sua senha foi redefinida.' });
      setTimeout(() => navigate('/login'), 3000);

    } catch (err) {
      console.error("Reset Password Error:", err);
      setError(err.message || 'Erro ao atualizar a senha. O link pode ter expirado.');
      toast({ title: 'Erro', description: err.message || 'Não foi possível redefinir a senha.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Optional: Check if the user is recovering or just landed here
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
         // You could potentially show a specific message or UI element
         console.log("Password recovery mode detected");
      }
    });
    return () => subscription.unsubscribe();
  }, []);


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-center">Redefinir Senha</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-600 text-center mb-2">{error}</div>}
          {message && <div className="text-green-600 text-center mb-2">{message}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
             <p className="text-sm text-center text-gray-600">Digite sua nova senha.</p>
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Atualizando...' : 'Redefinir Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;