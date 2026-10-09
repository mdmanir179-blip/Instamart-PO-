import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, UserProfile, Department, EmployeePermissions, ApprovalStatus } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../context/AuthContext';
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
  AlertTriangle,
  Edit3,
  Plus,
  Trash2,
  Check,
  Phone,
  Shield,
  UserPlus,
  Truck,
  Printer,
  Package,
  FileCheck,
  FileText
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { 
    allUsers, 
    toggleUserStatus, 
    updateUserRole, 
    updateUserProfile, 
    approveUser, 
    createUser, 
    deleteUser, 
    isAdmin, 
    currentUser 
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  
  // State for Add Employee modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Backoffice');
  const [newDept, setNewDept] = useState<Department>('Backoffice Team');

  // State for Edit Employee & Permissions modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Backoffice');
  const [editDept, setEditDept] = useState<Department>('Backoffice Team');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editApprovalStatus, setEditApprovalStatus] = useState<ApprovalStatus>('approved');
  const [editPermissions, setEditPermissions] = useState<EmployeePermissions>(DEFAULT_ROLE_PERMISSIONS.Backoffice);

  if (!isOpen) return null;

  // Safe user array
  const safeUsers = Array.isArray(allUsers) ? allUsers.filter(Boolean) : [];

  const pendingCount = safeUsers.filter((u) => u?.approvalStatus === 'pending' || u?.isApproved === false).length;
  const activeCount = safeUsers.filter((u) => u?.isActive).length;
  const inactiveCount = safeUsers.filter((u) => !u?.isActive).length;

  const filtered = safeUsers.filter((u) => {
    if (!u) return false;
    const term = (searchTerm || '').trim().toLowerCase();
    
    // Status tab filter
    if (filterTab === 'pending') {
      const isPending = u.approvalStatus === 'pending' || u.isApproved === false;
      if (!isPending) return false;
    } else if (filterTab === 'active') {
      if (!u.isActive) return false;
    } else if (filterTab === 'inactive') {
      if (u.isActive) return false;
    }

    if (!term) return true;

    const name = String(u.displayName || '').toLowerCase();
    const empId = String(u.employeeId || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    const role = String(u.role || '').toLowerCase();
    const dept = String(u.department || '').toLowerCase();

    return (
      name.includes(term) ||
      empId.includes(term) ||
      email.includes(term) ||
      role.includes(term) ||
      dept.includes(term)
    );
  });

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

  const handleQuickApprove = async (user: UserProfile) => {
    setUpdatingUid(user.uid);
    try {
      await approveUser(user.uid);
    } catch (err: any) {
      alert(err.message || 'Failed to approve user');
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleApproveAllPending = async () => {
    const pendingList = safeUsers.filter((u) => u?.approvalStatus === 'pending' || u?.isApproved === false);
    if (pendingList.length === 0) return;
    if (!confirm(`Are you sure you want to approve all ${pendingList.length} pending employee requests?`)) return;

    for (const u of pendingList) {
      try {
        await approveUser(u.uid);
      } catch (err) {
        console.warn('Failed to approve', u.uid, err);
      }
    }
  };

  const handleDelete = async (user: UserProfile) => {
    if (user.uid === currentUser?.uid) {
      alert('You cannot delete your own account while logged in.');
      return;
    }
    if (!confirm(`Are you sure you want to delete employee "${user.displayName || user.email}"? This action cannot be undone.`)) {
      return;
    }
    setUpdatingUid(user.uid);
    try {
      await deleteUser(user.uid);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setUpdatingUid(null);
    }
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditName(user.displayName || '');
    setEditEmployeeId(user.employeeId || '');
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditRole(user.role || 'Backoffice');
    setEditDept(user.department || 'Backoffice Team');
    setEditIsActive(user.isActive ?? true);
    setEditApprovalStatus(user.approvalStatus || (user.isApproved ? 'approved' : 'pending'));
    setEditPermissions(user.permissions || DEFAULT_ROLE_PERMISSIONS[user.role || 'Backoffice'] || DEFAULT_ROLE_PERMISSIONS.Backoffice);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUpdatingUid(editingUser.uid);
    try {
      const updates: Partial<UserProfile> = {
        displayName: editName.trim(),
        employeeId: editEmployeeId.trim().toUpperCase(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        role: editRole,
        department: editDept,
        isActive: editIsActive,
        isApproved: editApprovalStatus === 'approved',
        approvalStatus: editApprovalStatus,
        permissions: editPermissions,
      };

      await updateUserProfile(editingUser.uid, updates);
      setEditingUser(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update employee details');
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeName.trim() || !newEmail.trim()) {
      alert('Please fill employee name and email address.');
      return;
    }

    try {
      await createUser({
        displayName: newEmployeeName.trim(),
        employeeId: newEmployeeId.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        email: newEmail.trim(),
        phone: newPhone.trim(),
        role: newRole,
        department: newDept,
        isActive: true,
        isApproved: true,
        approvalStatus: 'approved',
        permissions: DEFAULT_ROLE_PERMISSIONS[newRole] || DEFAULT_ROLE_PERMISSIONS.Backoffice,
      });

      // Reset form
      setNewEmployeeName('');
      setNewEmployeeId('');
      setNewEmail('');
      setNewPhone('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-5xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 transition-all flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl">
                  Admin Employee Access & Permissions Control
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  Full Admin Power
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Admin Control: Approve Requests, Edit Profiles, Assign Roles & Manage Team Permissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Employee</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar: Search & Status Filters */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Top Filter Tabs & Quick Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                All Employees ({safeUsers.length})
              </button>
              
              <button
                type="button"
                onClick={() => setFilterTab('pending')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterTab === 'pending'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : pendingCount > 0
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                <span>Pending Approval</span>
                {pendingCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterTab === 'active'
                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                Active ({activeCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('inactive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterTab === 'inactive'
                    ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                Inactive ({inactiveCount})
              </button>
            </div>

            {/* Approve all pending shortcut */}
            {pendingCount > 0 && isAdmin && (
              <button
                type="button"
                onClick={handleApproveAllPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve All Pending ({pendingCount})</span>
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Employee Name, ID, Email, Role, or Department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* User Table */}
          <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700">
                  <tr>
                    <th className="py-3 px-3">Employee Details</th>
                    <th className="py-3 px-3">Emp ID</th>
                    <th className="py-3 px-3">Role & Department</th>
                    <th className="py-3 px-3 text-center">Admin Approval</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Admin Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-zinc-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <div>No employees matching criteria.</div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((user, idx) => {
                      const isSelf = user.uid === currentUser?.uid;
                      const displayName = user.displayName || user.email?.split('@')[0] || 'Employee';
                      const initial = String(displayName).charAt(0).toUpperCase() || 'U';
                      const isPending = user.approvalStatus === 'pending' || user.isApproved === false;

                      return (
                        <tr 
                          key={user.uid || `user-${idx}`} 
                          className={`hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition ${
                            isPending ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          {/* Name & Contact */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-xl font-extrabold flex items-center justify-center text-xs shadow-xs ${
                                user.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200'
                                  : user.role === 'Warehouse'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                                  : user.role === 'Logistics'
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200'
                                  : user.role === 'Print'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200'
                              }`}>
                                {initial}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                                  <span>{displayName}</span>
                                  {isSelf && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                                  {user.email || 'No email provided'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Emp ID */}
                          <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-zinc-300">
                            {user.employeeId || 'N/A'}
                          </td>

                          {/* Role & Dept */}
                          <td className="py-3 px-3">
                            <div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                user.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                  : user.role === 'Warehouse'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : user.role === 'Logistics'
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                  : user.role === 'Print'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}>
                                {user.role === 'admin' ? '👑 Admin' : user.role}
                              </span>
                              <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                {user.department || `${user.role} Team`}
                              </div>
                            </div>
                          </td>

                          {/* Admin Approval status */}
                          <td className="py-3 px-3 text-center">
                            {isPending ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  ⏳ Pending Approval
                                </span>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickApprove(user)}
                                    disabled={updatingUid === user.uid}
                                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs transition cursor-pointer"
                                    title="Click to approve employee immediately"
                                  >
                                    <Check className="w-3 h-3" /> Approve Now
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <ShieldCheck className="w-3 h-3 mr-1" /> Approved
                              </span>
                            )}
                          </td>

                          {/* Active Status */}
                          <td className="py-3 px-3 text-center">
                            {user.isActive ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle className="w-3 h-3 mr-1" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                <XCircle className="w-3 h-3 mr-1" /> Deactivated
                              </span>
                            )}
                          </td>

                          {/* Admin Controls */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              
                              {/* Edit & Permissions Button */}
                              <button
                                type="button"
                                onClick={() => openEditModal(user)}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 dark:bg-zinc-800 dark:hover:bg-blue-950/40 dark:text-zinc-200 dark:hover:text-blue-300 dark:border-zinc-700 transition flex items-center gap-1 cursor-pointer"
                                title="Edit employee details and grant specific permissions"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              {/* Toggle Active / Deactivate */}
                              <button
                                type="button"
                                disabled={updatingUid === user.uid || isSelf}
                                onClick={() => handleToggle(user.uid, Boolean(user.isActive))}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition shadow-xs cursor-pointer ${
                                  user.isActive
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                                } disabled:opacity-40`}
                              >
                                {updatingUid === user.uid
                                  ? '...'
                                  : user.isActive
                                  ? 'Deactivate'
                                  : 'Activate'}
                              </button>

                              {/* Delete Employee */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(user)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                  title="Delete Employee Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-zinc-400">
            <strong>Admin Note:</strong> All updates, permissions, and approval changes sync in real-time across all devices.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-zinc-600 transition cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>

      {/* MODAL 1: ADD NEW EMPLOYEE BY ADMIN */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h4 className="font-extrabold text-base">Add New Employee</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="EMP-1024"
                    value={newEmployeeId}
                    onChange={(e) => setNewEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="rahul@instamart.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setNewRole(r);
                      if (r === 'admin') setNewDept('Admin Team');
                      else if (r === 'Warehouse') setNewDept('Warehouse Team');
                      else if (r === 'Logistics') setNewDept('Logistics Team');
                      else if (r === 'Print') setNewDept('Print Team');
                      else setNewDept('Backoffice Team');
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Backoffice">💼 Backoffice</option>
                    <option value="Warehouse">🏭 Warehouse</option>
                    <option value="Logistics">🚚 Logistics</option>
                    <option value="Print">🖨️ Print Team</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Department
                  </label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value as Department)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Backoffice Team">Backoffice Team</option>
                    <option value="Warehouse Team">Warehouse Team</option>
                    <option value="Logistics Team">Logistics Team</option>
                    <option value="Print Team">Print Team</option>
                    <option value="Admin Team">Admin Team</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                ✅ Newly created employees are automatically approved by Admin with role-based default permissions.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition"
                >
                  Save & Approve Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EMPLOYEE & PERMISSIONS BY ADMIN */}
      {editingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-6">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <h4 className="font-extrabold text-base">
                  Edit Employee & Permissions: {editingUser.displayName || editingUser.email}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    required
                    value={editEmployeeId}
                    onChange={(e) => setEditEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Roles & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    System Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setEditRole(r);
                      // Apply default permissions for this role as baseline
                      setEditPermissions(DEFAULT_ROLE_PERMISSIONS[r] || DEFAULT_ROLE_PERMISSIONS.Backoffice);
                      if (r === 'admin') setEditDept('Admin Team');
                      else if (r === 'Warehouse') setEditDept('Warehouse Team');
                      else if (r === 'Logistics') setEditDept('Logistics Team');
                      else if (r === 'Print') setEditDept('Print Team');
                      else setEditDept('Backoffice Team');
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Backoffice">💼 Backoffice</option>
                    <option value="Warehouse">🏭 Warehouse</option>
                    <option value="Logistics">🚚 Logistics</option>
                    <option value="Print">🖨️ Print Team</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Department Team
                  </label>
                  <select
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value as Department)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Backoffice Team">Backoffice Team</option>
                    <option value="Warehouse Team">Warehouse Team</option>
                    <option value="Logistics Team">Logistics Team</option>
                    <option value="Print Team">Print Team</option>
                    <option value="Admin Team">Admin Team</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Admin Approval Status
                  </label>
                  <select
                    value={editApprovalStatus}
                    onChange={(e) => setEditApprovalStatus(e.target.value as ApprovalStatus)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="approved">✅ Approved by Admin</option>
                    <option value="pending">⏳ Pending Approval</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Account Access Status
                  </label>
                  <select
                    value={editIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditIsActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">🟢 Active (Full Access)</option>
                    <option value="inactive">🔴 Inactive / Suspended (Read Only)</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Section */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Granular Feature Permissions Matrix
                  </h5>
                  <span className="text-[10px] text-slate-500">
                    Admin can customize individual employee permissions
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-700">
                  
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editPermissions?.canCreatePO)}
                      onChange={(e) => setEditPermissions(prev => ({ ...prev, canCreatePO: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>📋 Create Purchase Orders (PO)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editPermissions?.canEditPO)}
                      onChange={(e) => setEditPermissions(prev => ({ ...prev, canEditPO: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>✏️ Edit Purchase Orders</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editPermissions?.canDeletePO)}
                      onChange={(e) => setEditPermissions(prev => ({ ...prev, canDeletePO: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>🗑️ Delete Purchase Orders</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editPermissions?.canUpdateLogistics)}
                      onChange={(e) => setEditPermissions(prev => ({ ...prev, canUpdateLogistics: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>🚚 Update In-Transit & Logistics</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editPermissions?.canUpdateGRN)}
                      onChange={(e) => setEditPermissions(prev => ({ ...prev, canUpdateGRN: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>📦 Warehouse Inward & Complete GRN</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editPermissions?.canCreateDN)}
                      onChange={(e) => setEditPermissions(prev => ({ ...prev, canCreateDN: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>📑 Raise & Manage Discrepancy Note (DN)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editPermissions?.canPrint)}
                      onChange={(e) => setEditPermissions(prev => ({ ...prev, canPrint: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>🖨️ Print Labels, Barcodes & Summaries</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editPermissions?.canManageUsers)}
                      onChange={(e) => setEditPermissions(prev => ({ ...prev, canManageUsers: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>👑 Admin Control & Manage Users</span>
                  </label>

                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingUid === editingUser.uid}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition disabled:opacity-50"
                >
                  {updatingUid === editingUser.uid ? 'Saving...' : 'Save & Update Employee'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
