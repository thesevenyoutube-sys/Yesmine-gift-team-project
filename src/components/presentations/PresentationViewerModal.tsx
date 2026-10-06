import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  History,
  Layers,
  Sparkles
} from 'lucide-react';
import { Presentation } from '../../types';

interface PresentationViewerModalProps {
  presentation: Presentation | null;
  onClose: () => void;
  canDownload: boolean;
}

export const PresentationViewerModal: React.FC<PresentationViewerModalProps> = ({
  presentation,
  onClose,
  canDownload,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Total simulated or actual slides
  const totalSlides = presentation?.slideCount || 8;

  useEffect(() => {
    if (presentation) {
      setCurrentPage(1);
      setZoomLevel(100);
      setSelectedVersion(presentation.version || 1);
    }
  }, [presentation]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!presentation) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        setCurrentPage((prev) => Math.min(totalSlides, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage((prev) => Math.max(1, prev - 1));
      } else if (e.key === 'Escape') {
        if (isFullScreen) {
          setIsFullScreen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentation, totalSlides, isFullScreen, onClose]);

  if (!presentation) return null;

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullScreen(false);
    }
  };

  // Convert Canva URL into embeddable format if needed
  const getCanvaEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('/view')) {
      return url.includes('?') ? `${url}&embed` : `${url}?embed`;
    }
    return url;
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col bg-slate-950 text-white transition-all select-none ${
        isFullScreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
    >
      {/* Top Control Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {presentation.type}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate text-slate-100">
              {presentation.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{presentation.category}</span>
              <span>•</span>
              <span className="text-indigo-400">v{selectedVersion}</span>
              {presentation.uploaderName && (
                <>
                  <span>•</span>
                  <span>by {presentation.uploaderName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Version Selector if multiple versions exist */}
          {presentation.versions && presentation.versions.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 text-xs border border-slate-700">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(Number(e.target.value))}
                className="bg-transparent text-slate-200 focus:outline-none"
              >
                <option value={presentation.version} className="bg-slate-900">
                  v{presentation.version} (Latest)
                </option>
                {presentation.versions.map((v) => (
                  <option key={v.versionNumber} value={v.versionNumber} className="bg-slate-900">
                    v{v.versionNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Toggle Thumbnails */}
          {presentation.type !== 'canva' && (
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              title="Toggle Thumbnails"
              className={`p-2 rounded-xl border text-xs transition-colors ${
                showThumbnails
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
          )}

          {/* Zoom controls for slides/PDF */}
          {presentation.type !== 'canva' && (
            <div className="hidden md:flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1 text-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                className="p-1 rounded hover:bg-slate-700 text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-[11px] text-slate-300 font-mono w-10 text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                className="p-1 rounded hover:bg-slate-700 text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Download button */}
          {canDownload && presentation.fileUrl && (
            <a
              href={presentation.fileUrl}
              download={`${presentation.title}.${presentation.type}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Download presentation"
            >
              <Download className="w-4 h-4" />
            </a>
          )}

          {/* Fullscreen presentation mode */}
          <button
            onClick={toggleFullScreen}
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Presentation Mode'}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-400 border border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Presentation View Area */}
      <div className="flex-1 flex overflow-hidden mt-3 relative">
        {/* Thumbnails Sidebar (Left) */}
        {showThumbnails && presentation.type !== 'canva' && (
          <aside className="w-44 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 mr-3 overflow-y-auto space-y-3 shrink-0 hidden sm:block">
            <div className="text-xs font-semibold text-slate-400 px-1 uppercase tracking-wider">
              Slides ({totalSlides})
            </div>
            {Array.from({ length: totalSlides }).map((_, i) => {
              const slideNum = i + 1;
              const isSelected = currentPage === slideNum;
              return (
                <button
                  key={slideNum}
                  onClick={() => setCurrentPage(slideNum)}
                  className={`w-full text-start p-2 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/60 ring-2 ring-indigo-500/40'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="aspect-16/10 bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 mb-1.5 overflow-hidden relative">
                    <span className="text-[10px] text-slate-500">Slide {slideNum}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Page {slideNum}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
                  </div>
                </button>
              );
            })}
          </aside>
        )}

        {/* Center Canvas / Embed */}
        <main className="flex-1 flex flex-col items-center justify-center relative bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden p-4">
          {presentation.type === 'canva' ? (
            /* Canva Embedded Frame */
            <div className="w-full h-full flex flex-col">
              <iframe
                title={presentation.title}
                src={getCanvaEmbedUrl(presentation.canvaUrl || '')}
                className="w-full flex-1 rounded-xl border border-slate-800 bg-slate-950"
                allowFullScreen
              />
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-2">
                <span>Embedded Canva Presentation</span>
                <a
                  href={presentation.canvaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:underline"
                >
                  Open in Canva <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : presentation.fileUrl?.startsWith('data:application/pdf') ||
            presentation.fileUrl?.endsWith('.pdf') ? (
            /* PDF Slide Viewer */
            <div
              className="w-full h-full flex items-center justify-center overflow-auto"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
            >
              <div className="w-full max-w-4xl aspect-16/10 bg-white text-slate-900 rounded-2xl shadow-2xl p-8 flex flex-col justify-between border border-slate-200">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      TH
                    </div>
                    <span className="font-bold text-sm tracking-tight text-slate-800">
                      {presentation.title}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Slide {currentPage} / {totalSlides}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center py-6 text-center">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {currentPage === 1
                      ? presentation.title
                      : `Key Slide Insight #${currentPage}`}
                  </h3>
                  <p className="text-slate-600 max-w-lg text-sm mb-6">
                    {currentPage === 1
                      ? presentation.description || 'Executive Presentation & Strategic Overview'
                      : `Detailed project milestones, deliverables, metrics, and timeline projection for section ${currentPage}.`}
                  </p>

                  <div className="grid grid-cols-3 gap-4 w-full max-w-md mt-4 text-start">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                      <p className="font-semibold text-xs text-indigo-600">Approved</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Category</span>
                      <p className="font-semibold text-xs text-slate-700">{presentation.category}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Version</span>
                      <p className="font-semibold text-xs text-emerald-600">v{selectedVersion}.0</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t">
                  <span>TeamHub Presentation Engine</span>
                  <span>Confidential & Internal</span>
                </div>
              </div>
            </div>
          ) : (
            /* PPTX / Image / General Slide Mock */
            <div
              className="w-full h-full flex items-center justify-center overflow-auto"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
            >
              <div className="w-full max-w-4xl aspect-16/10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-2xl p-8 flex flex-col justify-between border border-indigo-900/50">
                <div className="flex items-center justify-between border-b border-indigo-900/50 pb-4">
                  <span className="font-bold text-sm tracking-tight text-indigo-300">
                    {presentation.title}
                  </span>
                  <span className="text-xs text-indigo-400 font-mono">
                    Slide {currentPage} / {totalSlides}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center py-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-lg">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {currentPage === 1 ? presentation.title : `Slide Chapter ${currentPage}`}
                  </h3>
                  <p className="text-slate-300 max-w-lg text-sm">
                    {currentPage === 1
                      ? presentation.description || 'Interactive Presentation Deck'
                      : 'High-performance interactive slides rendered directly in browser viewport.'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-indigo-300/60 pt-4 border-t border-indigo-900/50">
                  <span>Category: {presentation.category}</span>
                  <span>TeamHub Presentation Mode</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Floating Navigation Bar (for non-Canva) */}
          {presentation.type !== 'canva' && (
            <div className="absolute bottom-5 flex items-center gap-3 px-4 py-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-slate-300 min-w-16 text-center">
                {currentPage} of {totalSlides}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalSlides, p + 1))}
                disabled={currentPage === totalSlides}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
