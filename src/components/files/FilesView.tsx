import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  Folder,
  UploadCloud,
  File,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  X,
  Lock,
  Plus
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useDemo } from '../../contexts/DemoContext';
import { FileItem, Project, Client } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { logAuditEvent } from '../../lib/audit';

export const FilesView: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const {
    isDemoMode,
    demoFiles,
    demoProjects,
    demoClients,
    demoRole,
    addDemoFile,
    deleteDemoFile,
  } = useDemo();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Upload state
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFolder, setUploadFolder] = useState('Documents');
  const [uploadProjectId, setUploadProjectId] = useState('');
  const [uploadClientId, setUploadClientId] = useState('');
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const folders = ['All', 'Documents', 'Contracts', 'Design', 'Proposals', 'General'];

  useEffect(() => {
    if (isDemoMode) {
      setFiles(demoFiles);
      setProjects(demoProjects);
      setClients(demoClients);
      setLoading(false);
      return;
    }

    if (!userProfile) return;

    const unsubFiles = onSnapshot(
      collection(db, 'files'),
      (snap) => {
        const list: FileItem[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setFiles(list);
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'files')
    );

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      const list: Project[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setProjects(list);
    });

    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      const list: Client[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setClients(list);
    });

    return () => {
      unsubFiles();
      unsubProjects();
      unsubClients();
    };
  }, [userProfile, isDemoMode, demoFiles, demoProjects, demoClients]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileObj(file);
      setUploadFileName(file.name);

      const reader = new FileReader();
      reader.onload = () => setFileDataUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileObj || !uploadFileName) return;

    setSaving(true);
    const id = `file_${Date.now()}`;
    const proj = projects.find((p) => p.id === uploadProjectId);
    const cl = clients.find((c) => c.id === uploadClientId);

    const newFile: FileItem = {
      id,
      name: uploadFileName,
      size: selectedFileObj.size,
      type: selectedFileObj.type || 'application/octet-stream',
      folder: uploadFolder,
      projectId: uploadProjectId || undefined,
      projectName: proj?.name,
      clientId: uploadClientId || undefined,
      clientName: cl?.name,
      url: fileDataUrl,
      uploadedBy: userProfile?.id || 'demo_user_1',
      uploaderName: userProfile?.name || 'Demo Admin',
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      addDemoFile(newFile);
      setIsUploadOpen(false);
      setSelectedFileObj(null);
      setFileDataUrl('');
      setUploadFileName('');
      setSaving(false);
      return;
    }

    try {
      await setDoc(doc(db, 'files', id), newFile);
      await logAuditEvent('file_uploaded', 'files', `Uploaded file "${uploadFileName}" to ${uploadFolder}`, id);
      setIsUploadOpen(false);
      setSelectedFileObj(null);
      setFileDataUrl('');
      setUploadFileName('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `files/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFile = async (f: FileItem) => {
    if (!window.confirm(`Delete file "${f.name}"?`)) return;

    if (isDemoMode) {
      deleteDemoFile(f.id);
      return;
    }

    try {
      await deleteDoc(doc(db, 'files', f.id));
      await logAuditEvent('file_deleted', 'files', `Deleted file "${f.name}"`, f.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `files/${f.id}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const effectiveIsAdmin = isDemoMode ? demoRole === 'admin' : isAdmin;

  // Role filtering: members only see files belonging to projects or clients they own or uploaded by them
  const visibleFiles = files.filter((f) => {
    if (effectiveIsAdmin) return true;
    if (f.uploadedBy === userProfile?.id) return true;
    // Check if member owns the client
    if (f.clientId) {
      const client = clients.find((c) => c.id === f.clientId);
      if (client && client.ownerId === userProfile?.id) return true;
    }
    return false;
  });

  const filteredFiles = visibleFiles.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFolder = selectedFolder === 'All' || f.folder === selectedFolder;
    return matchSearch && matchFolder;
  });

  if (loading) {
    return <LoadingSpinner message="Loading file storage..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Folder className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            File & Asset Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Secure cloud asset repository, categorized folders, and client attachments
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <UploadCloud className="w-4 h-4" /> Upload File
        </button>
      </div>

      {/* Filter and folder pills */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files by name..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFolder(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedFolder === f
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No Files Found"
          description="Upload project deliverables, brand assets, or contracts to your secure workspace."
          actionText="Upload File"
          onAction={() => setIsUploadOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => {
            const isImage = file.type.startsWith('image/');
            const isPdf = file.type.includes('pdf');
            const canDelete = isAdmin || file.uploadedBy === userProfile?.id;

            return (
              <div
                key={file.id}
                className="group p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      {isImage ? <ImageIcon className="w-5 h-5" /> : isPdf ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {file.folder}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600">
                    {file.name}
                  </h3>

                  <div className="mt-2 space-y-0.5 text-[11px] text-slate-400">
                    <p>{formatFileSize(file.size)}</p>
                    {file.projectName && <p className="truncate text-indigo-500 font-medium">Proj: {file.projectName}</p>}
                    {file.clientName && <p className="truncate text-emerald-500 font-medium">Client: {file.clientName}</p>}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">by {file.uploaderName}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewFile(file)}
                      title="Preview File"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {file.url && (
                      <a
                        href={file.url}
                        download={file.name}
                        target="_blank"
                        rel="noreferrer"
                        title="Download"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteFile(file)}
                        title="Delete File"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Upload New File</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Attach files to projects or clients with folder grouping
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/40">
                <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {selectedFileObj ? selectedFileObj.name : 'Choose file to upload'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Images, PDFs, documents, archives</span>
                <input type="file" onChange={handleFileSelect} className="hidden" />
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  File Display Name
                </label>
                <input
                  type="text"
                  required
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Folder
                  </label>
                  <select
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="Documents">Documents</option>
                    <option value="Contracts">Contracts</option>
                    <option value="Design">Design</option>
                    <option value="Proposals">Proposals</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Linked Project
                  </label>
                  <select
                    value={uploadProjectId}
                    onChange={(e) => setUploadProjectId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="">None</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Linked Client (Optional)
                </label>
                <select
                  value={uploadClientId}
                  onChange={(e) => setUploadClientId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="">None</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedFileObj}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  {saving ? 'Uploading...' : 'Save File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {previewFile.name}
                </h3>
                <span className="text-xs text-slate-400">{formatFileSize(previewFile.size)}</span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-16/10 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden mb-4">
              {previewFile.type.startsWith('image/') ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-h-full object-contain" />
              ) : (
                <div className="text-center text-slate-400 p-6">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-indigo-400" />
                  <p className="text-sm font-semibold text-slate-200">{previewFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Preview rendered. Download for full document.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <a
                href={previewFile.url}
                download={previewFile.name}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" /> Download Original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
