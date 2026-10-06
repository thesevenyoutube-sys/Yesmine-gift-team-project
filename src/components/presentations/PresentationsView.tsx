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
  Presentation as PresentationIcon,
  Plus,
  Search,
  Filter,
  Play,
  Trash2,
  Edit3,
  UploadCloud,
  Link2,
  FileText,
  Clock,
  Layers,
  Sparkles,
  Tag,
  AlertCircle
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDemo } from '../../contexts/DemoContext';
import { Presentation, PresentationVersion } from '../../types';
import { PresentationViewerModal } from './PresentationViewerModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { logAuditEvent } from '../../lib/audit';

export const PresentationsView: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const { isDemoMode, demoPresentations, addDemoPresentation, deleteDemoPresentation } = useDemo();
  const { t } = useLanguage();

  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'title'>('newest');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activePresentation, setActivePresentation] = useState<Presentation | null>(null);
  const [reversioningTarget, setReversioningTarget] = useState<Presentation | null>(null);

  // Form State
  const [uploadType, setUploadType] = useState<'file' | 'canva'>('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Clients');
  const [tagsInput, setTagsInput] = useState('');
  const [canvaUrl, setCanvaUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const categories = ['All', 'Clients', 'Internal', 'Training', 'Proposals'];

  // Subscribe to presentations collection
  useEffect(() => {
    if (isDemoMode) {
      setPresentations(demoPresentations);
      setLoading(false);
      return;
    }

    if (!userProfile) return;

    const unsubscribe = onSnapshot(
      collection(db, 'presentations'),
      (snapshot) => {
        const list: Presentation[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setPresentations(list);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'presentations');
        setError('Failed to load presentations');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile, isDemoMode, demoPresentations]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onload = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePresentation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setSaving(true);
    setError(null);
    try {
      const presId = `pres_${Date.now()}`;
      const ext = selectedFile?.name.split('.').pop()?.toLowerCase();
      const detectedType =
        uploadType === 'canva'
          ? 'canva'
          : ext === 'pptx' || ext === 'ppt'
          ? 'pptx'
          : ext === 'pdf'
          ? 'pdf'
          : 'images';

      const tags = tagsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const newPres: Presentation = {
        id: presId,
        title,
        description,
        category,
        type: detectedType,
        canvaUrl: uploadType === 'canva' ? canvaUrl : '',
        fileUrl: uploadType === 'file' ? fileBase64 : '',
        version: 1,
        versions: [],
        slideCount: 8,
        tags,
        uploadedBy: userProfile?.id || '',
        uploaderName: userProfile?.name || 'Member',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isDemoMode) {
        addDemoPresentation(newPres);
        setTitle('');
        setDescription('');
        setCanvaUrl('');
        setSelectedFile(null);
        setFileBase64('');
        setTagsInput('');
        setIsUploadOpen(false);
        setSaving(false);
        return;
      }

      await setDoc(doc(db, 'presentations', presId), newPres);
      await logAuditEvent(
        'presentation_created',
        'presentations',
        `Uploaded presentation "${title}" (${category})`,
        presId
      );

      // Reset
      setTitle('');
      setDescription('');
      setCanvaUrl('');
      setSelectedFile(null);
      setFileBase64('');
      setTagsInput('');
      setIsUploadOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save presentation');
    } finally {
      setSaving(false);
    }
  };

  const handleReuploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversioningTarget || !fileBase64) return;

    setSaving(true);
    try {
      const currentVersions = reversioningTarget.versions || [];
      const newVersionNum = (reversioningTarget.version || 1) + 1;

      const archivedVersion: PresentationVersion = {
        versionNumber: reversioningTarget.version || 1,
        fileUrl: reversioningTarget.fileUrl || '',
        uploadedBy: reversioningTarget.uploadedBy,
        uploaderName: reversioningTarget.uploaderName,
        createdAt: reversioningTarget.updatedAt || reversioningTarget.createdAt,
      };

      if (isDemoMode) {
        addDemoPresentation({
          ...reversioningTarget,
          fileUrl: fileBase64,
          version: newVersionNum,
          versions: [...currentVersions, archivedVersion],
          updatedAt: new Date().toISOString(),
        });
        setReversioningTarget(null);
        setSelectedFile(null);
        setFileBase64('');
        setSaving(false);
        return;
      }

      await updateDoc(doc(db, 'presentations', reversioningTarget.id), {
        fileUrl: fileBase64,
        version: newVersionNum,
        versions: [...currentVersions, archivedVersion],
        updatedAt: new Date().toISOString(),
      });

      await logAuditEvent(
        'presentation_version_updated',
        'presentations',
        `Updated presentation "${reversioningTarget.title}" to version ${newVersionNum}`,
        reversioningTarget.id
      );

      setReversioningTarget(null);
      setSelectedFile(null);
      setFileBase64('');
    } catch (err: any) {
      setError(err?.message || 'Failed to upload new version');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pres: Presentation) => {
    if (!window.confirm(`Are you sure you want to delete "${pres.title}"?`)) return;

    if (isDemoMode) {
      deleteDemoPresentation(pres.id);
      return;
    }

    try {
      await deleteDoc(doc(db, 'presentations', pres.id));
      await logAuditEvent(
        'presentation_deleted',
        'presentations',
        `Deleted presentation "${pres.title}"`,
        pres.id
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to delete presentation');
    }
  };

  // Filtered presentations
  const filteredPresentations = presentations
    .filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (loading) {
    return <LoadingSpinner message="Loading presentations library..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <PresentationIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Presentations & Pitch Decks
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Interactive slide viewer, Canva embeds, versioning, and client deck library
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Presentation / Deck</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search decks by title, tags or client..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 text-xs shrink-0 self-end md:self-auto">
          <span className="text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Presentations Library Grid */}
      {filteredPresentations.length === 0 ? (
        <EmptyState
          icon={PresentationIcon}
          title="No Presentations Found"
          description={
            searchTerm || categoryFilter !== 'All'
              ? 'No decks match your active filters. Try changing or clearing your search.'
              : 'Start by uploading your first presentation, client proposal, or Canva deck.'
          }
          actionText="Upload Presentation"
          onAction={() => setIsUploadOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredPresentations.map((pres) => {
            const canManage = isAdmin || pres.uploadedBy === userProfile?.id;

            return (
              <div
                key={pres.id}
                className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                {/* Slide Thumbnail Preview Container */}
                <div
                  onClick={() => setActivePresentation(pres)}
                  className="aspect-16/10 bg-slate-900 relative cursor-pointer overflow-hidden flex items-center justify-center group-hover:opacity-95 transition-opacity"
                >
                  {/* Decorative slide mockup */}
                  <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/80 text-white">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 font-mono text-[10px] uppercase font-bold tracking-wider">
                        {pres.type}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[10px] font-semibold">
                        v{pres.version || 1}
                      </span>
                    </div>

                    <div className="text-center my-auto">
                      <p className="font-bold text-sm text-slate-100 line-clamp-2 px-2 drop-shadow-xs">
                        {pres.title}
                      </p>
                      <span className="text-[11px] text-indigo-300/80 mt-1 inline-block">
                        {pres.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{pres.uploaderName || 'Team'}</span>
                      <span className="flex items-center gap-1 text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <Play className="w-3 h-3 fill-current" /> Play
                      </span>
                    </div>
                  </div>

                  {/* Play Overlay Hover */}
                  <div className="absolute inset-0 bg-indigo-600/30 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Card Meta & Actions */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => setActivePresentation(pres)}
                      className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                    >
                      {pres.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {pres.description || 'No description provided.'}
                    </p>

                    {/* Tags */}
                    {pres.tags && pres.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {pres.tags.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-medium"
                          >
                            <Tag className="w-2.5 h-2.5 opacity-60" /> {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Row */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(pres.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Re-upload version button */}
                      {canManage && pres.type !== 'canva' && (
                        <button
                          onClick={() => setReversioningTarget(pres)}
                          title="Upload New Version"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete */}
                      {canManage && (
                        <button
                          onClick={() => handleDelete(pres)}
                          title="Delete Deck"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 my-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Add New Presentation or Deck
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Upload PDF/PPTX slides or embed an interactive Canva share link
            </p>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setUploadType('file')}
                className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  uploadType === 'file'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText className="w-4 h-4" /> PDF / PPTX / Images
              </button>
              <button
                type="button"
                onClick={() => setUploadType('canva')}
                className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  uploadType === 'canva'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Link2 className="w-4 h-4" /> Canva Share Link
              </button>
            </div>

            <form onSubmit={handleCreatePresentation} className="space-y-4">
              {uploadType === 'file' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    File (PDF, PPTX, or Image)
                  </label>
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/40">
                    <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {selectedFile ? selectedFile.name : 'Choose a file or drag & drop'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      PDF, PPTX, Keynote export, PNG, JPG
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.pptx,.ppt,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Canva View / Share Link
                  </label>
                  <input
                    type="url"
                    required
                    value={canvaUrl}
                    onChange={(e) => setCanvaUrl(e.target.value)}
                    placeholder="https://www.canva.com/design/.../view"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Paste the public or team view URL from Canva to embed it seamlessly.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Deck Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Q4 Product Strategy & Client Pitch"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Clients">Clients</option>
                    <option value="Internal">Internal</option>
                    <option value="Training">Training</option>
                    <option value="Proposals">Proposals</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="q4, roadmap, keynote"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of the slides, target audience, and key takeaways..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || (uploadType === 'file' && !fileBase64 && !selectedFile)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  {saving ? 'Saving...' : 'Add to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RE-UPLOAD VERSION MODAL */}
      {reversioningTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Upload New Version
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Updating <strong>"{reversioningTarget.title}"</strong> to version{' '}
              {(reversioningTarget.version || 1) + 1}. Previous versions will be archived in
              history.
            </p>

            <form onSubmit={handleReuploadVersion} className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/40">
                <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {selectedFile ? selectedFile.name : 'Select updated presentation file'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.pptx,.ppt,.png,.jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReversioningTarget(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !fileBase64}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  {saving ? 'Uploading...' : 'Publish Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL SCREEN VIEWER MODAL */}
      <PresentationViewerModal
        presentation={activePresentation}
        onClose={() => setActivePresentation(null)}
        canDownload={true}
      />
    </div>
  );
};
