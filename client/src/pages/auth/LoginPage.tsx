import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('tosif@rizassociates.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.data) {
        const { token, user, organization } = res.data.data;
        login(token, user, organization);
        toast.success(`Welcome back, ${user.name}!`);
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-light-bg dark:bg-dark-bg transition-colors">
      <div className="w-full max-w-md p-8 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-brand-600 text-white shadow-lg shadow-blue-500/25 font-bold text-xl mb-1">
            CA
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            CA ProFlow
          </h1>
          <p className="text-xs font-semibold text-brand-500 tracking-wide">
            Simplifying Compliance
          </p>
        </div>

        {/* Demo Fast Login Pill */}
        <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 text-xs">
          <div className="font-bold text-brand-600 dark:text-blue-400 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Pre-seeded Demo Credentials:</span>
          </div>
          <div className="space-y-1 text-light-textSecondary dark:text-dark-textSecondary text-[13px]">
            <div>• CA Admin: <button type="button" onClick={() => handleDemoQuickLogin('tosif@rizassociates.com')} className="text-brand-500 underline font-semibold">tosif@rizassociates.com</button></div>
            <div>• Password: <span className="font-mono font-bold">Password123!</span></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-light-textMuted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@firm.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-light-textMuted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/25 active:scale-95 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-light-textSecondary dark:text-dark-textSecondary font-medium">
          Don't have an organization setup?{' '}
          <NavLink to="/register" className="text-brand-500 font-bold hover:underline">
            Register Firm
          </NavLink>
        </div>
      </div>
    </div>
  );
};
