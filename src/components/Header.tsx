import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Sun, 
  Moon, 
  Smartphone, 
  Monitor, 
  LogOut, 
  Bell,
  Database, 
  Users, 
  Truck,
  Building,
  CheckCircle2,
  AlertTriangle,
  Flame,
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  isMobilePreview: boolean;
  setIsMobilePreview: (val: boolean) => void;
  onOpenItemsModal: () => void;
  onOpenUsersModal: () => void;
  onOpenNewPoModal: () => void;
  onOpenNewDnModal: () => void;
  onOpenAuthModal?: () => void;
  expiringCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  isMobilePreview,
  setIsMobilePreview,
  onOpenItemsModal,
  onOpenUsersModal,
  onOpenNewPoModal,
  onOpenNewDnModal,
  onOpenAuthModal,
  expiringCount = 0
}) => {
  const { userProfile, isAdmin, isActive, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 border-b border-slate-200 dark:border-zinc-800 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand matching user's "Instamart Ops Portal" */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#fa5300] flex items-center justify-center text-white shadow-md shadow-orange-600/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
                  Instamart <span className="text-[#fa5300]">Ops Portal</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-md border border-orange-200 dark:border-orange-800 hidden sm:inline-block">
                  Live Operations
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium hidden md:block">
                Unified PO, In-Transit, GRN & Discrepancy Note Control
              </p>
            </div>
          </div>

          {/* Controls & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Expiry Notification Bell */}
            <div className="relative">
              <button
                type="button"
                title={expiringCount > 0 ? `${expiringCount} items expiring today!` : 'No expiries today'}
                className={`p-2 rounded-xl transition border ${
                  expiringCount > 0
                    ? 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 animate-pulse'
                    : 'bg-slate-50 dark:bg-zinc-800 text-slate-500 border-slate-200 dark:border-zinc-700'
                }`}
              >
                <Bell className="w-4 h-4" />
                {expiringCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                    {expiringCount}
                  </span>
                )}
              </button>
            </div>

            {/* Dark Mode toggle matching screenshot: [ 🌙 Dark Mode ] */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition"
              title="Toggle Light / Dark mode"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* Mobile / Desktop Simulator Toggle */}
            <button
              type="button"
              onClick={() => setIsMobilePreview(!isMobilePreview)}
              title={isMobilePreview ? 'Switch to Full Desktop View' : 'Switch to Mobile App View'}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                isMobilePreview
                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
              }`}
            >
              {isMobilePreview ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>

            {/* Admin Shortcuts */}
            {isAdmin && (
              <div className="hidden lg:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenItemsModal}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 flex items-center gap-1.5 transition"
                >
                  <Database className="w-3.5 h-3.5" />
                  Item Master
                </button>
                <button
                  type="button"
                  onClick={onOpenUsersModal}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center gap-1.5 transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  Employees
                </button>
              </div>
            )}

            {/* User Profile Pill */}
            {userProfile && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-zinc-800">
                <div 
                  onClick={onOpenAuthModal}
                  className="text-right cursor-pointer hover:opacity-85 transition hidden sm:block"
                  title="Click to switch employee or department"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      {userProfile.displayName}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded font-semibold border border-slate-200 dark:border-zinc-700">
                      {userProfile.employeeId}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                      userProfile.role === 'admin'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                        : userProfile.role === 'Warehouse'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    }`}>
                      {userProfile.department || userProfile.role}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  title="Switch Employee Role"
                  className="p-1.5 rounded-xl text-slate-600 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-zinc-800 transition"
                >
                  <UserCheck className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
