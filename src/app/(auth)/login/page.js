'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('cashier@noorpos.local');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Mock authentication with NextAuth/JWT structure
    setTimeout(() => {
      if (email && password) {
        router.push('/pos');
      } else {
        setError('Please enter a valid email and password.');
        setLoading(false);
      }
    }, 600);
  }

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-pink-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            MR BILAL
          </h2>
          <p className="text-xs text-zinc-400">
            Sign in to access Cashier Terminal & POS Admin
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">
              Staff Email / Cashier ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="cashier@noorpos.local"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Terminal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Social / OAuth Mock */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-zinc-900 px-2 text-zinc-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={() => router.push('/pos')}
          className="w-full py-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Quick Demo Cashier Login</span>
        </button>

        <div className="text-center text-xs text-zinc-400">
          Need a staff account?{' '}
          <Link href="/register" className="text-indigo-400 hover:underline font-medium">
            Register cashier
          </Link>
        </div>
      </div>
    </div>
  );
}
