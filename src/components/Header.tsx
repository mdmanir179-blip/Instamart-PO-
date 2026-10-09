import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Sun, 
  Moon, 
  Smartphone, 
  Monitor, 
  LogOut, 
  Bell,
  Clock,
  Database, 
  Users, 
  Truck,
  Building,
  CheckCircle2,
  AlertTriangle,
  Flame,
  UserCheck,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface HeaderProps {
  isMobilePreview: boolean;
  setIsMobilePreview: (val: boolean) => void;
  onOpenItemsModal: () => void;
  onOpenUsersModal: () => void;
  onOpenNewPoModal: () => void;
  onOpenNewDnModal: () => void;
  onOpenAuthModal?: () => void;
  onOpenExpiryModal?: () => void;
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
  onOpenExpiryModal,
  expiringCount = 0
}) => {
  const { userProfile, isAdmin, isActive, allUsers, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/90 dark:border-slate-800 backdrop-blur-md transition-colors w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand matching user's "Instamart Ops Portal" */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-800 dark:text-slate-100">
                  Instamart <span className="text-blue-600 dark:text-blue-400">Ops Portal</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 hidden sm:inline-block">
                  Desktop Fullscreen
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden md:block">
                Unified PO, In-Transit, GRN & Discrepancy Note Control
              </p>
            </div>
          </div>

          {/* Controls & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Live Clock / Date Widget */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-medium hidden lg:inline">
                | {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
              </span>
            </div>

            {/* Expiry Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={onOpenExpiryModal}
                title={expiringCount > 0 ? `${expiringCount} items expiring today! Click to view` : 'No critical expiries today'}
                className={`p-2 rounded-xl transition border cursor-pointer ${
                  expiringCount > 0
                    ? 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 animate-pulse'
                    : 'bg-slate-50 dark:bg-zinc-800 text-slate-500 border-slate-200 dark:border-zinc-700 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-4 h-4" />
                {expiringCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
                    {expiringCount}
                  </span>
                )}
              </button>
            </div>

            {/* Computer Full Screen Toggle Button */}
            <button
              type="button"
              onClick={toggleBrowserFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Computer Fullscreen Mode'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-orange-500" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />}
              <span className="hidden md:inline">{isFullscreen ? 'Exit Full Screen' : 'Computer Full Screen'}</span>
            </button>

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

            {/* Admin Shortcuts */}
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenItemsModal}
                  className="hidden md:flex px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 items-center gap-1.5 transition cursor-pointer"
                  title="Item Master SKU Database"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Item Master</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenUsersModal}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center gap-1.5 transition cursor-pointer relative"
                  title="Admin Employee & Access Control"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Employees</span>
                  {Array.isArray(allUsers) && allUsers.some((u) => u?.approvalStatus === 'pending' || u?.isApproved === false) && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping ml-0.5" />
                  )}
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
                  title="Switch Employee Account"
                  className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={logout}
                  title="Log Out"
                  className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
