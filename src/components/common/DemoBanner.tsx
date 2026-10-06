import React from 'react';
import { ShieldCheck, UserCheck, LogOut, Sparkles, RefreshCw, HelpCircle } from 'lucide-react';
import { useDemo } from '../../contexts/DemoContext';

interface DemoBannerProps {
  onOpenTour: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onOpenTour }) => {
  const { isDemoMode, demoRole, setDemoRole, exitDemo } = useDemo();

  if (!isDemoMode) return null;

  return (
    <div className="bg-gradient-to-r from-[#5B1FA8] via-[#7B2FF7] to-[#A020F0] text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md relative z-40">
      {/* Left side notice */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#FF9A1F] animate-pulse" />
        <span className="font-semibold tracking-wide">
          Demo mode: data is fake and not saved
        </span>
      </div>

      {/* Center & Right controls: Role switcher, Tour trigger, Exit button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Tour Helper */}
        <button
          onClick={onOpenTour}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white font-medium transition-colors"
          title="Restart Demo Tour"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FF9A1F]" />
          <span className="hidden sm:inline">Tour</span>
        </button>

        {/* Live Role Switcher */}
        <div className="flex items-center bg-black/30 rounded-lg p-0.5 border border-white/20">
          <button
            onClick={() => setDemoRole('admin')}
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
              demoRole === 'admin'
                ? 'bg-white text-[#5B1FA8] shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3 h-3" /> Admin
          </button>
          <button
            onClick={() => setDemoRole('member')}
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
              demoRole === 'member'
                ? 'bg-[#FF9A1F] text-slate-950 shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <UserCheck className="w-3 h-3" /> Member
          </button>
        </div>

        {/* Exit Demo Button */}
        <button
          onClick={exitDemo}
          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-white font-bold text-[11px] transition-colors border border-white/20"
        >
          <LogOut className="w-3 h-3" />
          <span>Exit Demo</span>
        </button>
      </div>
    </div>
  );
};
