import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KanbanSquare,
  Building2,
  Receipt,
  Presentation,
  ShieldCheck
} from 'lucide-react';
import { Logo } from './Logo';

interface DemoWelcomeTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
}

export const DemoWelcomeTour: React.FC<DemoWelcomeTourProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const tourSteps = [
    {
      title: 'Welcome to Safran Business Consulting',
      subtitle: 'Executive Advisory Workspace Tour',
      icon: Sparkles,
      content:
        'You have entered Demo Mode with pre-populated enterprise advisory data. Explore strategic projects, client CRM accounts, billing in Tunisian Dinar (TND), and interactive slide decks—without touching any live databases.',
      highlight: 'Full Admin rights enabled: you can create, modify, and delete data in memory.',
      actionTab: 'dashboard',
    },
    {
      title: 'Interactive Kanban Boards & Tasks',
      subtitle: 'Multi-Project Delivery Management',
      icon: KanbanSquare,
      content:
        'Manage 3 core advisory projects across Banking, Retail and Pharmaceuticals. Drag and drop tasks between To do, Doing, and Done columns. Try exporting to Excel or importing from .xlsx/.csv with column validation.',
      highlight: 'Assign tasks, adjust priorities, and inspect overdue deliverable warnings.',
      actionTab: 'tasks',
    },
    {
      title: 'Client CRM & Engagement Notes',
      subtitle: 'Enterprise Accounts & Relationship History',
      icon: Building2,
      content:
        'Browse 12 corporate clients including leading financial institutions and retail groups. Open client detail records to post consultation notes, review call timelines, and link deliverables.',
      highlight: 'Test Member vs Admin role: Members only see the accounts they own.',
      actionTab: 'clients',
    },
    {
      title: 'Invoices & Billing in TND with 19% VAT',
      subtitle: 'Financial Operations & PDF Export',
      icon: Receipt,
      content:
        'Inspect 8 client invoices (Draft, Sent, Paid, Overdue). Click the printer icon on any invoice to generate a clean, vector printable PDF with the official Safran Business Consulting header logo.',
      highlight: 'Automatic calculation of 19% VAT, milestone discounts, and net profit analytics.',
      actionTab: 'finance',
    },
    {
      title: 'Pitch Decks & Presentations Viewer',
      subtitle: 'Full-Screen In-App Slide Viewer',
      icon: Presentation,
      content:
        'Click any presentation to launch the full-screen slide viewer inside the app. Supports keyboard arrow navigation (Left/Right), thumbnail drawer, zoom controls, and embedded Canva decks.',
      highlight: 'Try versioning: upload a new version and inspect the archived history.',
      actionTab: 'presentations',
    },
    {
      title: 'Live Role Switcher & Security',
      subtitle: 'Test Zero-Trust Role Based Access (RBAC)',
      icon: ShieldCheck,
      content:
        'Notice the top bar banner: you can toggle between Admin and Member roles at any time. When in Member mode, tasks and clients are strictly partitioned to simulate corporate security policies.',
      highlight: 'All changes remain local to your session and reset on refresh.',
      actionTab: 'dashboard',
    },
  ];

  const step = tourSteps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onNavigateTab(tourSteps[nextStep].actionTab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onNavigateTab(tourSteps[prevStep].actionTab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      <div className="bg-[#14141F] text-[#F4F1FF] border border-[#26263A] rounded-3xl w-full max-w-xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Top gradient strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#A020F0] via-[#FF9A1F] to-[#5B1FA8]" />

        {/* Header with Logo */}
        <div className="flex items-center justify-between pb-4 border-b border-[#26263A] mb-6">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1E1E2D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#9B30FF]/20 border border-[#9B30FF]/30 text-[#9B30FF] flex items-center justify-center shrink-0">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF9A1F] block">
                {step.subtitle} • Step {currentStep + 1} of {tourSteps.length}
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-white">
                {step.title}
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2">
            {step.content}
          </p>

          <div className="p-3.5 rounded-2xl bg-[#0B0B12] border border-[#26263A] flex items-start gap-2.5 text-xs text-[#EFE7FF]">
            <CheckCircle2 className="w-4 h-4 text-[#FF9A1F] shrink-0 mt-0.5" />
            <span>{step.highlight}</span>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 my-6">
          {tourSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentStep(i);
                onNavigateTab(tourSteps[i].actionTab);
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep ? 'w-6 bg-[#9B30FF]' : 'w-2 bg-[#26263A]'
              }`}
            />
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#26263A]">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 rounded-xl border border-[#26263A] bg-[#1E1E2D] hover:bg-[#26263A] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#5B1FA8] hover:from-[#B030F5] hover:to-[#6A1BB1] text-white text-xs font-bold shadow-lg glow-purple flex items-center gap-1.5 transition-all"
            >
              <span>{currentStep === tourSteps.length - 1 ? 'Start Exploring' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
