import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from "@/contexts/AuthContext";

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

// Cliente para consumir a API backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function fetchWithRefresh(url, options = {}, tryRefresh = true) {
  let token = localStorage.getItem('token');
  let headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res = await fetch(url, { ...options, headers });
  if (res.status === 401 && tryRefresh) {
    // Tenta refresh
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('Sem refresh token');
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (!refreshRes.ok) throw new Error('Refresh token inválido');
      const data = await refreshRes.json();
      localStorage.setItem('token', data.accessToken);
      token = data.accessToken;
      headers['Authorization'] = `Bearer ${token}`;
      // Repete a requisição original
      res = await fetch(url, { ...options, headers });
    } catch {
      // Se falhar, faz logout
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }
  }
  return res;
}

export async function apiGet(path) {
  const res = await fetchWithRefresh(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error('Erro ao buscar dados da API');
  return res.json();
}

export async function apiPost(path, body, method = 'POST') {
  const res = await fetchWithRefresh(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Erro ao enviar dados para a API');
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetchWithRefresh(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Erro ao deletar na API');
  return res;
}

export async function apiRefreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('Sem refresh token');
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  if (!res.ok) throw new Error('Erro ao renovar token');
  const data = await res.json();
  localStorage.setItem('token', data.accessToken);
  return data.accessToken;
}
