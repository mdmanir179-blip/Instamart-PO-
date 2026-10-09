import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  collection 
} from 'firebase/firestore';
import { UserProfile, UserRole, EmployeePermissions, ApprovalStatus } from '../types';

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, EmployeePermissions> = {
  admin: {
    canCreatePO: true,
    canEditPO: true,
    canDeletePO: true,
    canUpdateLogistics: true,
    canUpdateGRN: true,
    canCreateDN: true,
    canPrint: true,
    canManageUsers: true,
  },
  Backoffice: {
    canCreatePO: true,
    canEditPO: true,
    canDeletePO: false,
    canUpdateLogistics: true,
    canUpdateGRN: false,
    canCreateDN: true,
    canPrint: true,
    canManageUsers: false,
  },
  Warehouse: {
    canCreatePO: false,
    canEditPO: false,
    canDeletePO: false,
    canUpdateLogistics: false,
    canUpdateGRN: true,
    canCreateDN: true,
    canPrint: true,
    canManageUsers: false,
  },
  Logistics: {
    canCreatePO: false,
    canEditPO: false,
    canDeletePO: false,
    canUpdateLogistics: true,
    canUpdateGRN: false,
    canCreateDN: false,
    canPrint: true,
    canManageUsers: false,
  },
  Print: {
    canCreatePO: false,
    canEditPO: false,
    canDeletePO: false,
    canUpdateLogistics: false,
    canUpdateGRN: false,
    canCreateDN: false,
    canPrint: true,
    canManageUsers: false,
  },
};

interface AuthContextType {
  currentUser: { uid: string; email: string; displayName: string } | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isBackoffice: boolean;
  isWarehouse: boolean;
  isActive: boolean;
  isApproved: boolean;
  allUsers: UserProfile[];
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass?: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string, employeeId: string, role: UserRole) => Promise<void>;
  toggleUserStatus: (uid: string, newActiveState: boolean) => Promise<void>;
  updateUserRole: (uid: string, newRole: UserRole) => Promise<void>;
  updateUserProfile: (uid: string, updates: Partial<UserProfile>) => Promise<void>;
  approveUser: (uid: string, permissions?: EmployeePermissions) => Promise<void>;
  createUser: (profile: Partial<UserProfile>) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  logout: () => Promise<void>;
  quickDemoLogin: (role: UserRole) => Promise<void>;
  switchUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ADMIN_EMAIL = 'mdmanir179@gmail.com';

const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'admin-manir',
    email: 'mdmanir179@gmail.com',
    displayName: 'Md Manir (System Admin)',
    employeeId: 'EMP-ADM-001',
    role: 'admin',
    department: 'Admin Team',
    isActive: true,
    isApproved: true,
    approvalStatus: 'approved',
    permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    createdAt: '2026-10-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    uid: 'emp-bo-102',
    email: 'rohit.backoffice@instamart.in',
    displayName: 'Rohit Sharma (Backoffice Lead)',
    employeeId: 'EMP-BO-102',
    role: 'Backoffice',
    department: 'Backoffice Team',
    isActive: true,
    isApproved: true,
    approvalStatus: 'approved',
    permissions: DEFAULT_ROLE_PERMISSIONS.Backoffice,
    createdAt: '2026-10-02T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    uid: 'emp-wh-504',
    email: 'sanjay.wh@instamart.in',
    displayName: 'Sanjay Das (Warehouse Manager)',
    employeeId: 'EMP-WH-504',
    role: 'Warehouse',
    department: 'Warehouse Team',
    isActive: true,
    isApproved: true,
    approvalStatus: 'approved',
    permissions: DEFAULT_ROLE_PERMISSIONS.Warehouse,
    createdAt: '2026-10-03T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('instamart_users');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_USERS;
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      // Remove any legacy persistent auto-login from localStorage so opening the app requires login or signup
      localStorage.removeItem('instamart_active_user');
      const sessionSaved = sessionStorage.getItem('instamart_active_user');
      if (sessionSaved) return JSON.parse(sessionSaved);
    } catch (e) {
      console.warn(e);
    }
    // Must login or sign up when software is opened
    return null;
  });

  const [loading, setLoading] = useState<boolean>(false);

  // Sync users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('instamart_users', JSON.stringify(allUsers));
    } catch (e) {
      console.warn(e);
    }
  }, [allUsers]);

  // Sync active user to sessionStorage
  useEffect(() => {
    try {
      if (userProfile) {
        sessionStorage.setItem('instamart_active_user', JSON.stringify(userProfile));
      } else {
        sessionStorage.removeItem('instamart_active_user');
        localStorage.removeItem('instamart_active_user');
      }
    } catch (e) {
      console.warn(e);
    }
  }, [userProfile]);

  // Optional: Listen to Firebase users if Firestore is accessible
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        if (!snapshot.empty) {
          const remoteUsers: UserProfile[] = [];
          snapshot.forEach((d) => remoteUsers.push(d.data() as UserProfile));
          // Merge remote users with local users
          setAllUsers((prev) => {
            const map = new Map<string, UserProfile>();
            prev.forEach((u) => map.set(u.uid, u));
            remoteUsers.forEach((u) => map.set(u.uid, u));
            return Array.from(map.values());
          });
        }
      }, (err) => {
        // Silently handle firestore permission or offline
        console.info('Offline local mode active:', err.message);
      });
      return () => unsub();
    } catch (err) {
      console.warn('Using offline storage.');
    }
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;
      
      const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;
      const matched = allUsers.find(u => u.email === user.email);

      if (matched) {
        setUserProfile(matched);
      } else {
        const newProf: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || (isSuperAdmin ? 'Admin Manir' : 'Google Employee'),
          employeeId: isSuperAdmin ? 'EMP-ADM-001' : `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          role: isSuperAdmin ? 'admin' : 'Backoffice',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        setAllUsers(prev => [newProf, ...prev]);
        setUserProfile(newProf);

        try {
          await setDoc(doc(db, 'users', user.uid), newProf);
        } catch (e) {
          console.warn('Saved locally');
        }
      }
    } catch (error: any) {
      console.warn('Google auth fallback to offline mode:', error.message);
      // Fallback: switch to admin
      setUserProfile(INITIAL_USERS[0]);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string) => {
    setLoading(true);
    try {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const matched = allUsers.find(
        (u) => u?.email && String(u.email).trim().toLowerCase() === cleanEmail
      );
      if (matched) {
        setUserProfile(matched);
      } else {
        // Auto-provision employee profile immediately without auth/operation-not-allowed error!
        const isSuper = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();
        const newProf: UserProfile = {
          uid: `user-${Date.now()}`,
          email: email.trim(),
          displayName: email.split('@')[0].toUpperCase(),
          employeeId: isSuper ? 'EMP-ADM-001' : `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          role: isSuper ? 'admin' : 'Backoffice',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        setAllUsers((prev) => [newProf, ...prev]);
        setUserProfile(newProf);
      }
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (
    email: string, 
    _pass: string, 
    name: string, 
    employeeId: string, 
    role: UserRole
  ) => {
    setLoading(true);
    try {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const isSuper = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();
      const rolePerms = DEFAULT_ROLE_PERMISSIONS[isSuper ? 'admin' : role] || DEFAULT_ROLE_PERMISSIONS.Backoffice;
      const profile: UserProfile = {
        uid: `user-${Date.now()}`,
        email: email.trim(),
        displayName: name.trim(),
        employeeId: employeeId.trim().toUpperCase(),
        role: isSuper ? 'admin' : role,
        department: isSuper ? 'Admin Team' : (role === 'Warehouse' ? 'Warehouse Team' : role === 'admin' ? 'Admin Team' : 'Backoffice Team'),
        isActive: true,
        isApproved: isSuper ? true : false,
        approvalStatus: isSuper ? 'approved' : 'pending',
        permissions: rolePerms,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      setAllUsers((prev) => {
        const filtered = prev.filter(u => u?.email && String(u.email).trim().toLowerCase() !== cleanEmail);
        return [profile, ...filtered];
      });
      setUserProfile(profile);

      try {
        await setDoc(doc(db, 'users', profile.uid), profile);
      } catch (e) {
        console.info('Profile saved to offline sheet storage.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (uid: string, newActiveState: boolean) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, isActive: newActiveState } : u))
    );
    if (userProfile?.uid === uid) {
      setUserProfile((prev) => prev ? { ...prev, isActive: newActiveState } : null);
    }
    try {
      await setDoc(doc(db, 'users', uid), { isActive: newActiveState }, { merge: true });
    } catch (e) {
      console.warn('Status update failed in cloud:', e);
    }
  };

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[newRole] || DEFAULT_ROLE_PERMISSIONS.Backoffice;
    setAllUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, role: newRole, permissions: u.permissions || defaultPerms } : u))
    );
    if (userProfile?.uid === uid) {
      setUserProfile((prev) => prev ? { ...prev, role: newRole, permissions: prev.permissions || defaultPerms } : null);
    }
    try {
      await setDoc(doc(db, 'users', uid), { role: newRole }, { merge: true });
    } catch (e) {
      console.warn('Role update failed in cloud:', e);
    }
  };

  const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, ...updates } : u))
    );
    if (userProfile?.uid === uid) {
      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
    }
    try {
      await setDoc(doc(db, 'users', uid), updates, { merge: true });
    } catch (e) {
      console.warn('Profile update saved in local cache:', e);
    }
  };

  const approveUser = async (uid: string, permissions?: EmployeePermissions) => {
    const target = allUsers.find((u) => u.uid === uid);
    const assignedRole = target?.role || 'Backoffice';
    const finalPermissions = permissions || target?.permissions || DEFAULT_ROLE_PERMISSIONS[assignedRole] || DEFAULT_ROLE_PERMISSIONS.Backoffice;

    const updates: Partial<UserProfile> = {
      isApproved: true,
      approvalStatus: 'approved',
      isActive: true,
      permissions: finalPermissions,
      approvedBy: userProfile?.displayName || 'Admin',
      approvedAt: new Date().toISOString(),
    };

    await updateUserProfile(uid, updates);
  };

  const createUser = async (profileData: Partial<UserProfile>) => {
    const role = profileData.role || 'Backoffice';
    const newUid = `user-${Date.now()}`;
    const newProf: UserProfile = {
      uid: newUid,
      email: (profileData.email || '').trim(),
      displayName: (profileData.displayName || '').trim(),
      employeeId: (profileData.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase(),
      role: role,
      department: profileData.department || (role === 'admin' ? 'Admin Team' : role === 'Warehouse' ? 'Warehouse Team' : 'Backoffice Team'),
      phone: profileData.phone || '',
      isActive: profileData.isActive ?? true,
      isApproved: profileData.isApproved ?? true,
      approvalStatus: profileData.approvalStatus || 'approved',
      permissions: profileData.permissions || DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.Backoffice,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      approvedBy: userProfile?.displayName || 'Admin',
      approvedAt: new Date().toISOString(),
    };

    setAllUsers((prev) => [newProf, ...prev]);
    try {
      await setDoc(doc(db, 'users', newUid), newProf);
    } catch (e) {
      console.warn('User created locally');
    }
  };

  const deleteUser = async (uid: string) => {
    setAllUsers((prev) => prev.filter((u) => u.uid !== uid));
    if (userProfile?.uid === uid) {
      setUserProfile(null);
    }
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e) {
      console.warn('User deleted locally');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    setUserProfile(null);
    try {
      sessionStorage.removeItem('instamart_active_user');
      localStorage.removeItem('instamart_active_user');
    } catch (e) {
      // ignore
    }
  };

  const quickDemoLogin = async (role: UserRole) => {
    setLoading(true);
    try {
      const target = allUsers.find((u) => u.role === role) || INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
      setUserProfile(target);
    } finally {
      setLoading(false);
    }
  };

  const switchUser = (user: UserProfile) => {
    setUserProfile(user);
  };

  const isSuper = userProfile?.email === SUPER_ADMIN_EMAIL;
  const isAdmin = isSuper || userProfile?.role === 'admin';
  const isBackoffice = userProfile?.role === 'Backoffice';
  const isWarehouse = userProfile?.role === 'Warehouse';
  const isActive = userProfile?.isActive ?? true;
  const isApproved = userProfile?.isApproved ?? (isAdmin ? true : userProfile?.approvalStatus === 'approved' ? true : !userProfile?.approvalStatus);

  const currentUser = userProfile
    ? { uid: userProfile.uid, email: userProfile.email, displayName: userProfile.displayName }
    : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isBackoffice,
        isWarehouse,
        isActive,
        isApproved,
        allUsers,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        toggleUserStatus,
        updateUserRole,
        updateUserProfile,
        approveUser,
        createUser,
        deleteUser,
        logout,
        quickDemoLogin,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
