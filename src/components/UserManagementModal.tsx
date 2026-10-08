import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, UserProfile } from '../types';
import { 
  X, 
  Users, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  Search,
  Building2,
  Mail,
  AlertTriangle
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { allUsers, toggleUserStatus, updateUserRole, isAdmin, currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = allUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = async (uid: string, currentStatus: boolean) => {
    setUpdatingUid(uid);
    try {
      await toggleUserStatus(uid, !currentStatus);
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    setUpdatingUid(uid);
    try {
      await updateUserRole(uid, newRole);
    } catch (err: any) {
      alert(err.message || 'Failed to change role');
    } finally {
      setUpdatingUid(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 transition-all flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl">
                Employee Access Control & User Management
              </h3>
              <p className="text-xs text-blue-200">
                Admin Control: Activate / Deactivate Accounts & Manage Team Permissions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Stats */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Employee Name, ID, or Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded-lg font-semibold">
                Total Users: <strong>{allUsers.length}</strong>
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg font-semibold border border-emerald-200 dark:border-emerald-800">
                Active: <strong>{allUsers.filter((u) => u.isActive).length}</strong>
              </span>
            </div>
          </div>

          {/* User Table */}
          <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700">
                <tr>
                  <th className="py-3 px-3">Employee Name</th>
                  <th className="py-3 px-3">Emp ID</th>
                  <th className="py-3 px-3">Email Address</th>
                  <th className="py-3 px-3">Team / Role</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                      No employees matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => {
                    const isSelf = user.uid === currentUser?.uid;
                    return (
                      <tr key={user.uid} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center text-xs">
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{user.displayName}</div>
                            {isSelf && (
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                                (Current You)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-zinc-300">
                          {user.employeeId}
                        </td>

                        <td className="py-3 px-3 text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                          {user.email}
                        </td>

                        <td className="py-3 px-3">
                          <select
                            disabled={updatingUid === user.uid || isSelf}
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                            className="px-2 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 outline-none"
                          >
                            <option value="Backoffice">💼 Backoffice</option>
                            <option value="Warehouse">🏭 Warehouse</option>
                            <option value="admin">👑 Admin</option>
                          </select>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {user.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle className="w-3 h-3 mr-1" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              <XCircle className="w-3 h-3 mr-1" /> Inactive
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            disabled={updatingUid === user.uid || isSelf}
                            onClick={() => handleToggle(user.uid, user.isActive)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition shadow-xs ${
                              user.isActive
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                            } disabled:opacity-40`}
                          >
                            {updatingUid === user.uid
                              ? 'Saving...'
                              : user.isActive
                              ? 'Deactivate'
                              : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
