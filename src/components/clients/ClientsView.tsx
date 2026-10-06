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
  Building2,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  UploadCloud,
  Mail,
  Phone,
  User,
  Trash2,
  Eye,
  Edit3,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDemo } from '../../contexts/DemoContext';
import { Client, ClientStatus, UserProfile } from '../../types';
import { exportToExcel } from '../../lib/excel';
import { ExcelImportModal } from '../common/ExcelImportModal';
import { ClientDetailModal } from './ClientDetailModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { logAuditEvent } from '../../lib/audit';

interface ClientsViewProps {
  initialOpenNewClient?: boolean;
  onAddTaskForClient?: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  initialOpenNewClient = false,
  onAddTaskForClient,
}) => {
  const { userProfile, isAdmin } = useAuth();
  const {
    isDemoMode,
    demoClients,
    demoUsers,
    demoRole,
    addDemoClient,
    deleteDemoClient,
  } = useDemo();
  const { t } = useLanguage();

  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isAddClientOpen, setIsAddClientOpen] = useState(initialOpenNewClient);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);

  // Form State
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientStatus, setClientStatus] = useState<ClientStatus>('lead');
  const [clientNotes, setClientNotes] = useState('');
  const [clientOwnerId, setClientOwnerId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      setClients(demoClients);
      setTeamMembers(demoUsers);
      setLoading(false);
      return;
    }

    if (!userProfile) return;

    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      const list: Client[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setClients(list);
      setLoading(false);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setTeamMembers(list);
    });

    return () => {
      unsubClients();
      unsubUsers();
    };
  }, [userProfile, isDemoMode, demoClients, demoUsers]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !companyName) return;

    setSaving(true);
    const id = `client_${Date.now()}`;
    const owner = teamMembers.find((m) => m.id === clientOwnerId) || {
      id: userProfile?.id || '',
      name: userProfile?.name || 'Self',
    };

    const newClient: Client = {
      id,
      name: clientName,
      company: companyName,
      phone: clientPhone,
      email: clientEmail,
      status: clientStatus,
      notes: clientNotes,
      ownerId: owner.id,
      ownerName: owner.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      addDemoClient(newClient);
      setIsAddClientOpen(false);
      setClientName('');
      setCompanyName('');
      setClientPhone('');
      setClientEmail('');
      setClientNotes('');
      setSaving(false);
      return;
    }

    try {
      await setDoc(doc(db, 'clients', id), newClient);
      await logAuditEvent('client_created', 'clients', `Created client "${clientName}" (${companyName})`, id);
      setIsAddClientOpen(false);
      setClientName('');
      setCompanyName('');
      setClientPhone('');
      setClientEmail('');
      setClientNotes('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `clients/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (!window.confirm(`Delete client "${client.name}"?`)) return;

    if (isDemoMode) {
      deleteDemoClient(client.id);
      return;
    }

    try {
      await deleteDoc(doc(db, 'clients', client.id));
      await logAuditEvent('client_deleted', 'clients', `Deleted client "${client.name}"`, client.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `clients/${client.id}`);
    }
  };

  const handleExportExcel = () => {
    const data = filteredClients.map((c) => ({
      Name: c.name,
      Company: c.company,
      Email: c.email || '',
      Phone: c.phone || '',
      Status: c.status.toUpperCase(),
      Owner: c.ownerName,
      Notes: c.notes || '',
    }));
    exportToExcel(data, `Safran_Clients_${new Date().toISOString().split('T')[0]}`, 'Clients');
  };

  const handleImportClients = async (validRows: any[]) => {
    for (const row of validRows) {
      const id = `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const c: Client = {
        id,
        name: row.name,
        company: row.company,
        email: row.email || '',
        phone: row.phone || '',
        status: row.status,
        notes: row.notes || '',
        ownerId: userProfile?.id || '',
        ownerName: userProfile?.name || 'Self',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isDemoMode) {
        addDemoClient(c);
      } else {
        await setDoc(doc(db, 'clients', id), c);
      }
    }

    if (!isDemoMode) {
      await logAuditEvent('clients_imported', 'clients', `Imported ${validRows.length} clients from spreadsheet`);
    }
  };

  const effectiveIsAdmin = isDemoMode ? demoRole === 'admin' : isAdmin;

  // Role enforcement: member sees only clients they own, admin sees all
  const visibleClients = clients.filter((c) => {
    if (effectiveIsAdmin) return true;
    return c.ownerId === userProfile?.id;
  });

  const filteredClients = visibleClients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm));
    const matchStatus = statusFilter === 'All' || c.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  if (loading) {
    return <LoadingSpinner message="Loading client CRM directory..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {t.clientsCRM}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Client contacts, lead management, notes timeline and linked task deliverables
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-600" /> Import .xlsx
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export .xlsx
          </button>
          <button
            onClick={() => {
              setClientOwnerId(userProfile?.id || '');
              setIsAddClientOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> {t.createClient}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchClients}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['All', 'Lead', 'Active', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {st === 'All'
                ? t.allStatuses
                : st === 'Lead'
                ? t.lead
                : st === 'Active'
                ? t.active
                : t.closed}
            </button>
          ))}
        </div>
      </div>

      {/* Client List / Cards */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Clients Found"
          description="Build your client roster, log communications, and attach project deliverables."
          actionText={t.createClient}
          onAction={() => setIsAddClientOpen(true)}
        />
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">{t.name}</th>
                <th className="py-3.5 px-4">{t.company}</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-3 text-center">{t.status}</th>
                <th className="py-3.5 px-4">{t.owner}</th>
                <th className="py-3.5 px-4 text-end">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 cursor-pointer"
                  onClick={() => setSelectedClientForDetail(client)}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {client.name}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                    {client.company}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {client.email && <div className="truncate">{client.email}</div>}
                    {client.phone && <div className="text-[11px] opacity-80">{client.phone}</div>}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        client.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : client.status === 'lead'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {client.ownerName}
                  </td>
                  <td className="py-3.5 px-4 text-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedClientForDetail(client)}
                        title="View Details & Notes"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(isAdmin || client.ownerId === userProfile?.id) && (
                        <button
                          onClick={() => handleDeleteClient(client)}
                          title="Delete Client"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD CLIENT MODAL */}
      {isAddClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {t.createClient}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add client contact information, status, and assign an account owner
            </p>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Sarah Miller"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Technologies"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="sarah@acme.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={clientStatus}
                    onChange={(e) => setClientStatus(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="lead">{t.lead}</option>
                    <option value="active">{t.active}</option>
                    <option value="closed">{t.closed}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Owner
                  </label>
                  <select
                    value={clientOwnerId}
                    onChange={(e) => setClientOwnerId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Notes
                </label>
                <textarea
                  rows={2}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Key background, budget expectation, introductory meeting..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddClientOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  {saving ? 'Saving...' : t.createClient}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      <ClientDetailModal
        client={selectedClientForDetail}
        onClose={() => setSelectedClientForDetail(null)}
        onAddTaskForClient={(client) => {
          if (onAddTaskForClient) onAddTaskForClient(client);
        }}
      />

      {/* EXCEL IMPORT MODAL */}
      <ExcelImportModal
        type="clients"
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportClients}
        currentUser={{ id: userProfile?.id || '', name: userProfile?.name || 'User' }}
      />
    </div>
  );
};
