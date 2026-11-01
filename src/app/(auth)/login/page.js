'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@boutique.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function performLogin(loginEmail, loginPassword) {
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ email: loginEmail, password: loginPassword });
      if (res.token) {
        localStorage.setItem('boutique_token', res.token);
        localStorage.setItem('boutique_user', JSON.stringify(res.user));
        router.push('/dashboard');
      } else {
        setError('Login response did not include an authentication token.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await performLogin(email, password);
  }

  function handleQuickLogin(roleEmail, rolePass) {
    setEmail(roleEmail);
    setPassword(rolePass);
    performLogin(roleEmail, rolePass);
  }

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-pink-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            MR BILAL
          </h2>
          <p className="text-xs text-zinc-400">
            Sign in to access Ladies Clothing POS & Inventory System
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Staff Email / Cashier ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="admin@boutique.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating with MySQL...' : 'Sign In to Terminal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Staff Logins */}
        <div className="relative pt-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-zinc-900 px-2 text-zinc-500">Quick Demo Staff Accounts</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@boutique.com', 'admin123')}
            className="py-2 px-1 text-center rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 hover:border-pink-500/50 text-[11px] font-bold text-zinc-200 transition"
          >
            <div className="text-pink-400 font-extrabold text-[10px]">Super Admin</div>
            <div className="text-[10px] text-zinc-400 truncate">Saif</div>
          </button>
          
          <button
            type="button"
            onClick={() => handleQuickLogin('manager@boutique.com', 'admin123')}
            className="py-2 px-1 text-center rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 hover:border-indigo-500/50 text-[11px] font-bold text-zinc-200 transition"
          >
            <div className="text-indigo-400 font-extrabold text-[10px]">Manager</div>
            <div className="text-[10px] text-zinc-400 truncate">Bilal</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('cashier@boutique.com', 'admin123')}
            className="py-2 px-1 text-center rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 hover:border-emerald-500/50 text-[11px] font-bold text-zinc-200 transition"
          >
            <div className="text-emerald-400 font-extrabold text-[10px]">Cashier #1</div>
            <div className="text-[10px] text-zinc-400 truncate">Zainab</div>
          </button>
        </div>

        <div className="text-center text-xs text-zinc-500">
          Default password: <span className="font-mono text-zinc-400">admin123</span>
        </div>
      </div>
    </div>
  );
}
