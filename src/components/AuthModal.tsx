import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole, Department } from '../types';
import { 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  Warehouse, 
  Truck, 
  Printer, 
  Moon, 
  Sun,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    userProfile, 
    allUsers, 
    loginWithEmail, 
    signupWithEmail, 
    quickDemoLogin, 
    switchUser 
  } = useAuth();
  
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // Form fields matching the screenshots
  const [selectedDept, setSelectedDept] = useState<Department>('Backoffice Team');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('manishankarmandal6@gmail.com');
  const [password, setPassword] = useState('••••••');
  
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  if (!isOpen) return null;

  // Department mapping to role
  const getRoleFromDept = (dept: Department): UserRole => {
    if (dept === 'Admin Team') return 'admin';
    if (dept === 'Warehouse Team') return 'Warehouse';
    return 'Backoffice';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadingAction(true);

    try {
      if (mode === 'login') {
        if (!email.trim()) {
          throw new Error('Please enter your Email ID.');
        }
        await loginWithEmail(email);
        if (onClose) onClose();
      } else {
        if (!employeeName.trim()) {
          throw new Error('Employee Name is required.');
        }
        if (!employeeId.trim()) {
          throw new Error('Employee ID is required.');
        }
        if (!email.trim()) {
          throw new Error('Email ID is required.');
        }
        const role = getRoleFromDept(selectedDept);
        await signupWithEmail(email, password, employeeName, employeeId, role);
        if (onClose) onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setLoadingAction(true);
    try {
      await quickDemoLogin(role);
      if (onClose) onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-white dark:bg-zinc-950 min-h-screen overflow-y-auto">
      {/* Top Navbar matching Image: "Instamart Ops Portal" + Dark Mode button */}
      <header className="w-full border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3.5 flex items-center justify-between">
        <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span>Instamart Ops Portal</span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </header>

      {/* Main Center Form Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row transition-all">
          
          {/* Left Dark Column (Matching Image: "Unified PO, In-Transit, GRN & Discrepancy Note Control") */}
          <div className="w-full md:w-[42%] bg-[#0e1626] dark:bg-[#090e17] p-8 sm:p-12 flex flex-col justify-center items-center text-center select-none relative overflow-hidden">
            <div className="relative z-10 max-w-xs space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                Unified PO, In–Transit,<br />
                GRN & Discrepancy<br />
                Note Control
              </h1>
              <p className="text-xs text-slate-400 pt-2 font-medium">
                Instamart Quick Commerce Supply Chain System
              </p>
            </div>
            
            {/* Subtle background glow */}
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Right White Column (Form area matching Screenshot) */}
          <div className="w-full md:w-[58%] p-6 sm:p-8 bg-white dark:bg-zinc-900 flex flex-col justify-center">
            
            {/* Header with Title and Mode Toggle pill */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {mode === 'login' ? 'Employee Log In' : 'Employee Sign Up'}
              </h2>

              {/* Toggle Pills: [ Log In ]  [ Sign Up ] */}
              <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    mode === 'login'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Sign Up Department Selection (From Image 2) */}
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Select Department / Team <span className="text-orange-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDept('Admin Team')}
                      className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition text-left ${
                        selectedDept === 'Admin Team'
                          ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Admin Team</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDept('Backoffice Team')}
                      className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition text-left ${
                        selectedDept === 'Backoffice Team'
                          ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-orange-500" />
                      <span>Backoffice Team</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDept('Warehouse Team')}
                      className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition text-left ${
                        selectedDept === 'Warehouse Team'
                          ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                      <span>Warehouse Team</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDept('Logistics Team')}
                      className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition text-left ${
                        selectedDept === 'Logistics Team'
                          ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Logistics Team</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDept('Print Team')}
                      className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition text-left sm:col-span-2 ${
                        selectedDept === 'Print Team'
                          ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Print Team</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sign Up: Employee Name & Employee ID in 2 columns (Image 2) */}
              {mode === 'signup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Employee Name <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Full Name"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50/60 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Employee ID <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g.  EMP-1042"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50/60 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Email & Password (Shown in 2 columns in Image 2, and side-by-side or stacked in Image 1) */}
              <div className={mode === 'signup' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Email ID <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="manishankarmandal6@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#eef4ff] dark:bg-blue-950/30 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-zinc-100 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Password <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#eef4ff] dark:bg-blue-950/30 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-zinc-100 font-medium tracking-widest"
                  />
                </div>
              </div>

              {/* Big Orange Submit Button matching Image: "Log In to Portal ->" or "Sign Up & Create Account ->" */}
              <button
                type="submit"
                disabled={loadingAction}
                className="w-full py-2.5 px-4 bg-[#fa5300] hover:bg-[#e04a00] text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 mt-4"
              >
                <span>
                  {mode === 'login' ? 'Log In to Portal' : 'Sign Up & Create Account'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick 1-click test role access footer */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-zinc-300">
                <Sparkles className="w-3 h-3 text-amber-500" /> Quick Role Access:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-semibold text-[10px]"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('Backoffice')}
                  className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-semibold text-[10px]"
                >
                  Backoffice
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('Warehouse')}
                  className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-[10px]"
                >
                  Warehouse
                </button>
              </div>
            </div>

            {onClose && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[11px] text-slate-400 hover:underline"
                >
                  Continue to Portal (Logged in as {userProfile?.displayName})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-3 text-center text-[11px] text-slate-400 dark:text-zinc-600 border-t border-slate-100 dark:border-zinc-900">
        Instamart Supply Chain Operations • Unified DarkStore Logistics Hub
      </footer>
    </div>
  );
};
