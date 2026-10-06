import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import {
  X,
  Building2,
  Phone,
  Mail,
  User,
  Clock,
  Send,
  Plus,
  CheckCircle2,
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDemo } from '../../contexts/DemoContext';
import { Client, ClientNote, Task } from '../../types';
import { logAuditEvent } from '../../lib/audit';

interface ClientDetailModalProps {
  client: Client | null;
  onClose: () => void;
  onAddTaskForClient: (client: Client) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  onClose,
  onAddTaskForClient,
}) => {
  const { userProfile, isAdmin } = useAuth();
  const { isDemoMode, demoNotes, demoTasks, addDemoClientNote } = useDemo();
  const { t } = useLanguage();

  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (!client) return;

    if (isDemoMode) {
      setNotes(demoNotes[client.id] || []);
      setLinkedTasks(demoTasks.filter((t) => t.clientId === client.id));
      return;
    }

    // Fetch notes subcollection
    const notesQuery = query(
      collection(db, 'clients', client.id, 'notes'),
      orderBy('createdAt', 'desc')
    );

    const unsubNotes = onSnapshot(notesQuery, (snap) => {
      const list: ClientNote[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setNotes(list);
    });

    // Fetch linked tasks
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      const list: Task[] = [];
      snap.forEach((d) => {
        const data = d.data() as Task;
        if (data.clientId === client.id) {
          list.push({ ...data, id: d.id });
        }
      });
      setLinkedTasks(list);
    });

    return () => {
      unsubNotes();
      unsubTasks();
    };
  }, [client, isDemoMode, demoNotes, demoTasks]);

  if (!client) return null;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !userProfile) return;

    setSubmittingNote(true);
    const noteId = `note_${Date.now()}`;
    const newNote: ClientNote = {
      id: noteId,
      clientId: client.id,
      content: newNoteContent.trim(),
      authorId: userProfile.id,
      authorName: userProfile.name,
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      addDemoClientNote(client.id, newNote);
      setNewNoteContent('');
      setSubmittingNote(false);
      return;
    }

    try {
      await setDoc(doc(db, 'clients', client.id, 'notes', noteId), newNote);
      await logAuditEvent('client_note_added', 'clients', `Added note to client "${client.name}"`, client.id);
      setNewNoteContent('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `clients/${client.id}/notes/${noteId}`);
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl p-6 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {client.name}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    client.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : client.status === 'lead'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {client.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {client.company} • Account Lead: {client.ownerName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Info Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 text-xs">
          {client.email && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{client.phone}</span>
            </div>
          )}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">Owner: {client.ownerName}</span>
          </div>
        </div>

        {/* Main Content Split: Notes History vs Linked Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* LEFT: NOTES TIMELINE */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {t.notesHistory}
            </h3>

            {/* Post note form */}
            <form onSubmit={handleAddNote} className="mb-4">
              <textarea
                rows={2}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder={t.notePlaceholder}
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="flex justify-end mt-1.5">
                <button
                  type="submit"
                  disabled={submittingNote || !newNoteContent.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" /> {t.addNote}
                </button>
              </div>
            </form>

            {/* Notes Stream */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {notes.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">{t.noNotesYet}</p>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed mb-2">
                      {n.content}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        {n.authorName}
                      </span>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: LINKED TASKS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {t.linkedTasks}
              </h3>
              <button
                onClick={() => {
                  onAddTaskForClient(client);
                  onClose();
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {t.addLinkedTask}
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {linkedTasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">{t.noLinkedTasksYet}</p>
              ) : (
                linkedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                        {task.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          task.status === 'done'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : task.status === 'doing'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>Assigned: {task.assigneeName}</span>
                      <span>Due: {task.dueDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
