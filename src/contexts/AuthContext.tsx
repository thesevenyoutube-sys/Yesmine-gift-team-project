import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, limit, query } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { useDemo } from './DemoContext';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  needsFirstTimeSetup: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, role?: UserRole, title?: string) => Promise<void>;
  setupFirstAdmin: (email: string, pass: string, name: string, title?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BOOTSTRAP_ADMIN_EMAIL = 'agrinova.ponic@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [needsFirstTimeSetup, setNeedsFirstTimeSetup] = useState<boolean>(false);

  // Check if workspace already has any users/admins registered
  const checkFirstTimeSetup = async () => {
    try {
      const usersQuery = query(collection(db, 'users'), limit(1));
      const usersSnap = await getDocs(usersQuery);
      setNeedsFirstTimeSetup(usersSnap.empty);
    } catch {
      // If permission denies read prior to auth, we don't block
      setNeedsFirstTimeSetup(false);
    }
  };

  const fetchProfile = async (user: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Check if user is bootstrap admin
        if (user.email === BOOTSTRAP_ADMIN_EMAIL && data.role !== 'admin') {
          const updated: UserProfile = { ...data, role: 'admin' };
          await setDoc(userRef, updated, { merge: true });
          await setDoc(doc(db, 'admins', user.uid), {
            userId: user.uid,
            email: user.email,
            createdAt: new Date().toISOString()
          });
          setUserProfile(updated);
        } else {
          setUserProfile(data);
        }
      } else {
        // Create initial profile if missing
        const isBootstrap = user.email === BOOTSTRAP_ADMIN_EMAIL;
        const initialProfile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'Team Member'),
          role: isBootstrap ? 'admin' : 'member',
          title: isBootstrap ? 'Lead Administrator' : 'Team Member',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(userRef, initialProfile);
        if (isBootstrap) {
          await setDoc(doc(db, 'admins', user.uid), {
            userId: user.uid,
            email: user.email,
            createdAt: new Date().toISOString()
          });
        }
        setUserProfile(initialProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }
  };

  useEffect(() => {
    checkFirstTimeSetup();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const signUp = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole = 'member',
    title: string = 'Team Member'
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    await updateProfile(cred.user, { displayName: name });

    const isBootstrap = cred.user.email === BOOTSTRAP_ADMIN_EMAIL;
    const finalRole: UserRole = isBootstrap ? 'admin' : role;

    const profile: UserProfile = {
      id: cred.user.uid,
      email: cred.user.email || email,
      name,
      role: finalRole,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      if (finalRole === 'admin') {
        await setDoc(doc(db, 'admins', cred.user.uid), {
          userId: cred.user.uid,
          email: cred.user.email,
          createdAt: new Date().toISOString(),
        });
      }
      setUserProfile(profile);
      setNeedsFirstTimeSetup(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${cred.user.uid}`);
    }
  };

  const setupFirstAdmin = async (
    email: string,
    pass: string,
    name: string,
    title: string = 'Workspace Administrator'
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    await updateProfile(cred.user, { displayName: name });

    const profile: UserProfile = {
      id: cred.user.uid,
      email: cred.user.email || email,
      name,
      role: 'admin',
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      await setDoc(doc(db, 'admins', cred.user.uid), {
        userId: cred.user.uid,
        email: cred.user.email,
        createdAt: new Date().toISOString(),
      });

      // Also create a welcome project & activity log
      const defaultProjectId = 'project_welcome';
      await setDoc(doc(db, 'projects', defaultProjectId), {
        id: defaultProjectId,
        name: 'Workspace Launch',
        description: 'Initial team tasks and onboarding milestone.',
        color: '#6366f1',
        status: 'active',
        createdBy: cred.user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Sample task
      const defaultTaskId = 'task_welcome';
      await setDoc(doc(db, 'tasks', defaultTaskId), {
        id: defaultTaskId,
        projectId: defaultProjectId,
        title: 'Review TeamHub Settings & Invite Team',
        description: 'Verify workspace settings, create projects, and assign initial client leads.',
        assigneeId: cred.user.uid,
        assigneeName: name,
        assigneeEmail: email,
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        priority: 'high',
        status: 'todo',
        createdBy: cred.user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Activity log
      const actId = `act_${Date.now()}`;
      await setDoc(doc(db, 'activities', actId), {
        id: actId,
        type: 'workspace_initialized',
        description: `${name} initialized the TeamHub workspace as Administrator`,
        userId: cred.user.uid,
        userName: name,
        createdAt: new Date().toISOString(),
      });

      setUserProfile(profile);
      setNeedsFirstTimeSetup(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${cred.user.uid}`);
    }
  };

  const { isDemoMode, demoUser, demoRole, exitDemo } = useDemo();

  const signOut = async () => {
    if (isDemoMode) {
      exitDemo();
      return;
    }
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  const effectiveUser = isDemoMode
    ? ({
        uid: demoUser.id,
        email: demoUser.email,
        displayName: demoUser.name,
      } as unknown as FirebaseUser)
    : currentUser;

  const effectiveProfile = isDemoMode ? demoUser : userProfile;
  const effectiveIsAdmin = isDemoMode
    ? demoRole === 'admin'
    : userProfile?.role === 'admin' || currentUser?.email === BOOTSTRAP_ADMIN_EMAIL;
  const effectiveLoading = isDemoMode ? false : loading;
  const effectiveNeedsSetup = isDemoMode ? false : needsFirstTimeSetup;

  return (
    <AuthContext.Provider
      value={{
        currentUser: effectiveUser,
        userProfile: effectiveProfile,
        isAdmin: effectiveIsAdmin,
        loading: effectiveLoading,
        needsFirstTimeSetup: effectiveNeedsSetup,
        signIn,
        signUp,
        setupFirstAdmin,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
