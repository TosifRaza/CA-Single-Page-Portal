import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Scale,
  TrendingUp,
  Calculator,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const PromotionalCard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div
      className={`relative overflow-hidden p-6 rounded-2xl shadow-lg h-full flex flex-col justify-between transition-all duration-300 ${
        theme === 'light'
          ? 'bg-gradient-to-br from-[#1675FF] via-[#1262dc] to-[#0A47B2] text-white shadow-blue-500/25'
          : 'bg-gradient-to-br from-[#182a4d] via-[#13203b] to-[#0b1324] text-white border border-[#233558] shadow-blue-900/30'
      }`}
    >
      {/* Background Graphic Accents */}
      <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute right-4 bottom-4 opacity-15 dark:opacity-25 pointer-events-none">
        {theme === 'light' ? (
          <div className="flex items-center gap-3">
            <Calculator className="w-20 h-20 text-white" />
            <TrendingUp className="w-16 h-16 text-white" />
          </div>
        ) : (
          <Scale className="w-24 h-24 text-blue-400" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[240px]">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 dark:bg-blue-500/20 text-white text-[13px] font-semibold mb-3 backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>CA Practice Suite</span>
        </div>

        <h3 className="text-xl font-bold tracking-tight text-white leading-tight">
          {theme === 'light'
            ? 'Stay Compliant, Grow Confident'
            : 'Your Compliance, Simplified'}
        </h3>

        <p className="mt-2 text-xs text-blue-100 dark:text-blue-200 leading-relaxed font-medium">
          {theme === 'light'
            ? 'Your Complete CA Practice Management Platform'
            : 'Manage, Track & File with Ease'}
        </p>
      </div>

      {/* Working Action Button */}
      <div className="relative z-10 mt-6">
        <button
          onClick={() => navigate('/works')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
            theme === 'light'
              ? 'bg-white text-brand-600 hover:bg-blue-50 hover:shadow-white/20'
              : 'bg-brand-500 text-white hover:bg-brand-600 hover:shadow-brand-500/30'
          }`}
        >
          <span>View Filings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
