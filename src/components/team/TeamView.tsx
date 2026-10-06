import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import {
  Users,
  ShieldAlert,
  User,
  Plus,
  Mail,
  Briefcase,
  Trash2,
  Edit2,
  CheckCircle2,
  Lock,
  Search
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDemo } from '../../contexts/DemoContext';
import { UserProfile, UserRole, Task, Client } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { logAuditEvent } from '../../lib/audit';

export const TeamView: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const {
    isDemoMode,
    demoUsers,
    demoTasks,
    demoClients,
    demoRole,
    addDemoUser,
    updateDemoUser,
    deleteDemoUser,
  } = useDemo();
  const { t } = useLanguage();

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<UserProfile | null>(null);

  // Invite Form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [inviteTitle, setInviteTitle] = useState('Product Specialist');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      setMembers(demoUsers);
      setTasks(demoTasks);
      setClients(demoClients);
      setLoading(false);
      return;
    }

    if (!userProfile) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setMembers(list);
      setLoading(false);
    });

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      const list: Task[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setTasks(list);
    });

    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      const list: Client[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setClients(list);
    });

    return () => {
      unsubUsers();
      unsubTasks();
      unsubClients();
    };
  }, [userProfile, isDemoMode, demoUsers, demoTasks, demoClients]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    setSaving(true);
    const newUid = `user_${Date.now()}`;
    const newProfile: UserProfile = {
      id: newUid,
      email: inviteEmail.trim(),
      name: inviteName.trim(),
      role: inviteRole,
      title: inviteTitle.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      addDemoUser(newProfile);
      setIsInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteTitle('Strategy Specialist');
      setSaving(false);
      return;
    }

    try {
      await setDoc(doc(db, 'users', newUid), newProfile);
      if (inviteRole === 'admin') {
        await setDoc(doc(db, 'admins', newUid), {
          userId: newUid,
          email: inviteEmail.trim(),
          createdAt: new Date().toISOString(),
        });
      }

      await logAuditEvent('member_invited', 'team', `Added team member "${inviteName}" as ${inviteRole}`, newUid);
      setIsInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteTitle('Product Specialist');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${newUid}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRole = async (member: UserProfile, newRole: UserRole) => {
    const effectiveIsAdmin = isDemoMode ? demoRole === 'admin' : isAdmin;
    if (!effectiveIsAdmin) return;

    if (isDemoMode) {
      updateDemoUser(member.id, { role: newRole });
      setEditingMember(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', member.id), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });

      if (newRole === 'admin') {
        await setDoc(doc(db, 'admins', member.id), {
          userId: member.id,
          email: member.email,
          createdAt: new Date().toISOString(),
        });
      } else {
        await deleteDoc(doc(db, 'admins', member.id));
      }

      await logAuditEvent('member_role_changed', 'team', `Changed ${member.name}'s role to ${newRole}`, member.id);
      setEditingMember(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${member.id}`);
    }
  };

  const handleRemoveMember = async (member: UserProfile) => {
    const effectiveIsAdmin = isDemoMode ? demoRole === 'admin' : isAdmin;
    if (!effectiveIsAdmin) return;

    if (member.id === userProfile?.id) {
      alert('You cannot remove yourself.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${member.name} from the workspace?`)) return;

    if (isDemoMode) {
      deleteDemoUser(member.id);
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', member.id));
      await deleteDoc(doc(db, 'admins', member.id));
      await logAuditEvent('member_removed', 'team', `Removed team member ${member.name}`, member.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${member.id}`);
    }
  };

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.title && m.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <LoadingSpinner message="Loading team directory..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {t.teamDirectory}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.manageMembers} • {members.length} active team members
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> {t.inviteMember}
          </button>
        )}
      </div>

      {/* Role notice banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0" />
        <div>
          <strong className="block font-semibold">Workspace Access Control:</strong>
          <span>{t.memberRestrictedNotice}</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search team member by name or role..."
          className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
        />
      </div>

      {/* Team Member Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.map((member) => {
          const assignedCount = tasks.filter((t) => t.assigneeId === member.id).length;
          const ownedClientCount = clients.filter((c) => c.ownerId === member.id).length;
          const isUserAdmin = member.role === 'admin';

          return (
            <div
              key={member.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row with avatar & role pill */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        {member.name}
                        {member.id === userProfile?.id && (
                          <span className="text-[10px] text-slate-400 font-normal">(You)</span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{member.title || 'Team Member'}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isUserAdmin
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {member.role}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4 truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>

                {/* Stats badge */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">{t.assignedTasks}</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">{assignedCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">{t.ownedClients}</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">{ownedClientCount}</strong>
                  </div>
                </div>
              </div>

              {/* Admin Actions Footer */}
              {isAdmin && (
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Role:</span>
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member, e.target.value as UserRole)}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {member.id !== userProfile?.id && (
                    <button
                      onClick={() => handleRemoveMember(member)}
                      title={t.removeMember}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* INVITE MEMBER MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {t.inviteMember}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add a new team member and configure their access permissions
            </p>

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="alex@teamhub.com"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={inviteTitle}
                  onChange={(e) => setInviteTitle(e.target.value)}
                  placeholder="Senior Account Executive"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role Permission
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="member">Member (Sees assigned tasks & owned clients only)</option>
                  <option value="admin">Admin (Full workspace access & management)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  {saving ? 'Adding...' : 'Add Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
