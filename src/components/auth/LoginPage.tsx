import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  ShieldCheck,
  UserCheck,
  Moon,
  Sun,
  Globe,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Award,
  BarChart,
  Users
} from 'lucide-react';
import { LanguageCode } from '../../types';
import { Logo } from '../common/Logo';
import { useDemo } from '../../contexts/DemoContext';
import { DEMO_ENABLED } from '../../config/demo';

export const LoginPage: React.FC = () => {
  const { signIn, signUp, setupFirstAdmin, needsFirstTimeSetup } = useAuth();
  const { enterDemo } = useDemo();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [mode, setMode] = useState<'signin' | 'signup' | 'setup'>(
    needsFirstTimeSetup ? 'setup' : 'signin'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all required credentials.');
      return;
    }

    if ((mode === 'signup' || mode === 'setup') && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else if (mode === 'setup') {
        await setupFirstAdmin(email, password, name || 'Managing Partner', title || 'Managing Partner & Practice Lead');
      } else {
        await signUp(email, password, name || 'Consulting Associate', 'member', title || 'Strategy Consultant');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Invalid credentials. Please verify your corporate email and password.');
      } else if (msg.includes('email-already-in-use')) {
        setError('This corporate email is already registered.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0B0B12] text-[#F4F1FF] antialiased">
      {/* LEFT SIDE: Brand Presentation Showcase (Split Screen) */}
      <div className="lg:w-1/2 relative bg-gradient-to-br from-[#120B22] via-[#0E0C1C] to-[#0B0B12] p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#26263A]">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#9B30FF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FF9A1F]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Logo size="lg" />
          <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-purple-950/60 border border-purple-800/40 text-[#FF9A1F]">
            ENTERPRISE SUITE
          </span>
        </div>

        {/* Center Presentation Copy & Highlights */}
        <div className="relative z-10 my-10 lg:my-0 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-900/40 to-orange-900/30 border border-purple-500/30 text-xs font-semibold text-purple-200 mb-6">
            <Award className="w-4 h-4 text-[#FF9A1F]" />
            Elite Corporate Advisory & Transformation
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-heading">
            Strategy. Governance. Measurable Value.
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#6B6B80] dark:text-slate-300 leading-relaxed">
            Welcome to the centralized operating portal for Safran Business Consulting partners,
            advisors, and enterprise client engagements.
          </p>

          {/* Consulting Pillars Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8 text-xs font-medium">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#14141F]/80 border border-[#26263A] text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-[#9B30FF] shrink-0" />
              <span>Strategic Transformation</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#14141F]/80 border border-[#26263A] text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-[#FF9A1F] shrink-0" />
              <span>Financial & M&A Modeling</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#14141F]/80 border border-[#26263A] text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-[#9B30FF] shrink-0" />
              <span>Executive Slide Decks</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#14141F]/80 border border-[#26263A] text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-[#FF9A1F] shrink-0" />
              <span>Client CRM & Audit Trail</span>
            </div>
          </div>
        </div>

        {/* Bottom Trust Metrics */}
        <div className="relative z-10 pt-6 border-t border-[#26263A]/80 grid grid-cols-3 gap-4 text-center">
          <div>
            <span className="font-extrabold text-xl sm:text-2xl text-white font-brand block">
              $140M+
            </span>
            <span className="text-[10px] text-[#6B6B80] uppercase tracking-wider">
              Advised Value
            </span>
          </div>
          <div>
            <span className="font-extrabold text-xl sm:text-2xl text-[#FF9A1F] font-brand block">
              98.4%
            </span>
            <span className="text-[10px] text-[#6B6B80] uppercase tracking-wider">
              On-Time Delivery
            </span>
          </div>
          <div>
            <span className="font-extrabold text-xl sm:text-2xl text-purple-400 font-brand block">
              Zero
            </span>
            <span className="text-[10px] text-[#6B6B80] uppercase tracking-wider">
              Security Breach
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form */}
      <div className="lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-16 bg-[#0B0B12]">
        {/* Top Controls: Language & Theme */}
        <div className="flex items-center justify-end gap-2 mb-6">
          <div className="flex items-center bg-[#14141F] border border-[#26263A] rounded-xl p-1 text-xs font-semibold shadow-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 mx-2" />
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                language === 'en' ? 'bg-[#9B30FF] text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('fr')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                language === 'fr' ? 'bg-[#9B30FF] text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage('ar')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                language === 'ar' ? 'bg-[#9B30FF] text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              العربية
            </button>
          </div>

          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-[#14141F] border border-[#26263A] text-slate-300 hover:text-white shadow-xs"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {/* Center Card */}
        <div className="w-full max-w-md mx-auto my-auto">
          <div className="p-8 rounded-3xl bg-[#14141F] border border-[#26263A] shadow-2xl relative overflow-hidden">
            {/* Top purple to orange gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#A020F0] via-[#FF9A1F] to-[#5B1FA8]" />

            {/* Mode Header */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-950/60 border border-purple-800/40 text-purple-300 mb-2">
                {mode === 'setup' ? 'Administrator Setup' : mode === 'signup' ? 'Consultant Registration' : 'Partner Sign In'}
              </span>

              <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
                {mode === 'setup'
                  ? 'Initialize Advisory Practice'
                  : mode === 'signup'
                  ? 'Create Consultant Profile'
                  : 'Welcome to Safran'}
              </h2>
              <p className="text-xs text-[#6B6B80] mt-1">
                Enter your credentials to access the strategic workspace
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Switch tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#0B0B12] rounded-xl mb-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'signin' ? 'bg-[#1E1E2D] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(needsFirstTimeSetup ? 'setup' : 'signup');
                  setError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'signup' || mode === 'setup'
                    ? 'bg-[#1E1E2D] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {needsFirstTimeSetup ? 'Admin Setup' : 'Register'}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {(mode === 'signup' || mode === 'setup') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jean-Paul Laurent"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#26263A] bg-[#0B0B12] text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#9B30FF]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Consulting Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={mode === 'setup' ? 'Managing Partner' : 'Senior Strategy Consultant'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#26263A] bg-[#0B0B12] text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#9B30FF]/30"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Corporate Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="advisor@safran-consulting.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#26263A] bg-[#0B0B12] text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#9B30FF]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#26263A] bg-[#0B0B12] text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#9B30FF]/30"
                />
              </div>

              {(mode === 'signup' || mode === 'setup') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#26263A] bg-[#0B0B12] text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#9B30FF]/30"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#A020F0] via-[#7B2FF7] to-[#5B1FA8] hover:from-[#B030F5] hover:to-[#6A1BB1] text-white font-bold text-xs uppercase tracking-wider shadow-lg glow-purple flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>
                      {mode === 'setup'
                        ? 'Initialize Admin Practice'
                        : mode === 'signup'
                        ? 'Join Consulting Team'
                        : 'Enter Advisory Workspace'}
                    </span>
                    <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
            </form>

            {/* DEMO ACCESS SECTION (Only shown when DEMO_ENABLED is true) */}
            {DEMO_ENABLED && (
              <div className="mt-6 pt-5 border-t border-[#26263A] space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#FF9A1F]">
                  <span>Instant Test Access</span>
                  <span className="text-[10px] text-slate-400 font-normal">No account needed</span>
                </div>

                {/* Primary Demo Admin Button */}
                <button
                  type="button"
                  onClick={() => enterDemo('admin')}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#A020F0] via-[#7B2FF7] to-[#5B1FA8] hover:from-[#B030F5] hover:to-[#6A1BB1] text-white font-bold text-xs uppercase tracking-wider shadow-lg glow-purple flex items-center justify-center gap-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-[#FF9A1F]" />
                  <span>Enter Demo (Admin)</span>
                </button>

                {/* Secondary Demo Member Button */}
                <button
                  type="button"
                  onClick={() => enterDemo('member')}
                  className="w-full py-2 px-4 rounded-xl border border-[#FF9A1F]/50 bg-[#FF9A1F]/10 hover:bg-[#FF9A1F]/20 text-[#FF9A1F] font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Enter Demo (Member)</span>
                </button>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-[#26263A] text-center text-xs text-[#6B6B80]">
              <span>Safran Business Consulting • Zero-Trust Cloud Architecture</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-[#6B6B80] pt-6">
          © {new Date().getFullYear()} Safran Business Consulting. All Rights Reserved.
        </div>
      </div>
    </div>
  );
};
