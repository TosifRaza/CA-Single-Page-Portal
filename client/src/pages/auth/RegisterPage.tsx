import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Building,
  Lock,
  Mail,
  User,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    organizationName: '',
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/register', formData);
      if (res.data?.data) {
        const { token, user, organization } = res.data.data;
        login(token, user, organization);
        toast.success('Firm registered successfully!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-light-bg dark:bg-dark-bg transition-colors">
      <div className="w-full max-w-md p-8 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-brand-600 text-white shadow-lg shadow-blue-500/25 font-bold text-xl mb-1">
            CA
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-light-textPrimary dark:text-dark-textPrimary">
            Register Firm Account
          </h1>
          <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary font-medium">
            Deploy your dedicated practice management workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-medium">
          <div>
            <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1">
              Firm / Practice Name *
            </label>
            <div className="relative">
              <Building className="absolute left-3.5 top-2.5 w-4 h-4 text-light-textMuted" />
              <input
                type="text"
                required
                placeholder="e.g. RIZ & Associates"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1">
              CA Partner / Administrator Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-2.5 w-4 h-4 text-light-textMuted" />
              <input
                type="text"
                required
                placeholder="e.g. Tosif Raza"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-light-textMuted" />
              <input
                type="email"
                required
                placeholder="partner@firm.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-light-textPrimary dark:text-dark-textPrimary mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-light-textMuted" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-textPrimary dark:text-dark-textPrimary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/25 active:scale-95 transition-all disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-light-textSecondary dark:text-dark-textSecondary font-medium">
          Already have an account?{' '}
          <NavLink to="/login" className="text-brand-500 font-bold hover:underline">
            Sign In
          </NavLink>
        </div>
      </div>
    </div>
  );
};
