import React, { useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  ShieldCheck,
  Compass,
  Cpu,
  Layers,
  Plus,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Search,
  Filter,
  Trash2,
  Tag,
  Receipt
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDemo } from '../../contexts/DemoContext';
import { ServiceItem } from '../../config/demo';

export const ServicesView: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const { isDemoMode, demoServices, addDemoService, deleteDemoService, demoRole } = useDemo();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Strategic Advisory');
  const [description, setDescription] = useState('');
  const [priceTND, setPriceTND] = useState<number>(30000);
  const [vatRate, setVatRate] = useState<number>(19);
  const [deliverablesInput, setDeliverablesInput] = useState('');

  const effectiveIsAdmin = isDemoMode ? demoRole === 'admin' : isAdmin;

  const categories = [
    'All',
    'Strategic Advisory',
    'Corporate Finance & M&A',
    'Digital & Technology',
    'Operations Advisory',
    'Compliance & Governance',
    'Sustainability',
    'Organizational Development',
    'Commercial & Marketing',
  ];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !priceTND) return;

    const deliverables = deliverablesInput
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const newService: ServiceItem = {
      id: `srv_${Date.now()}`,
      name,
      category,
      description,
      priceTND: Number(priceTND),
      vatRate: Number(vatRate) / 100,
      deliverables: deliverables.length > 0 ? deliverables : ['Executive Report', 'Implementation Roadmap'],
    };

    if (isDemoMode) {
      addDemoService(newService);
    }

    setIsAddOpen(false);
    setName('');
    setDescription('');
    setDeliverablesInput('');
  };

  const servicesList = demoServices;

  const filteredServices = servicesList.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'All' || s.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-900/30 text-purple-300 border border-purple-800/40 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#FF9A1F]" />
            <span>Safran Advisory Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B12] dark:text-white font-heading flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-[#9B30FF]" />
            Services & Advisory Practices
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B80] dark:text-slate-400 mt-1">
            Standard engagement packages with fixed pricing in Tunisian Dinar (TND) and 19% VAT rate.
          </p>
        </div>

        {effectiveIsAdmin && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#5B1FA8] hover:from-[#B030F5] hover:to-[#6A1BB1] text-white text-xs font-bold uppercase tracking-wider shadow-lg glow-purple flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Practice Offering</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#14141F] border border-[#EFE7FF] dark:border-[#26263A] shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search practices, deliverables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-[#26263A] bg-slate-50 dark:bg-[#0B0B12] text-xs focus:outline-none focus:ring-2 focus:ring-[#9B30FF]/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#26263A] bg-slate-50 dark:bg-[#0B0B12] text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400 shrink-0 font-medium">
            {filteredServices.length} offerings
          </span>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredServices.map((service) => {
          const vatAmount = service.priceTND * (service.vatRate || 0.19);
          const totalTTC = service.priceTND + vatAmount;

          return (
            <div
              key={service.id}
              className="rounded-3xl p-6 bg-white dark:bg-[#14141F] border border-[#EFE7FF] dark:border-[#26263A] shadow-md hover:border-[#9B30FF]/40 transition-all flex flex-col justify-between relative group"
            >
              <div>
                {/* Category Pill */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-[#9B30FF] border border-purple-200 dark:border-purple-800/40">
                    {service.category}
                  </span>

                  {effectiveIsAdmin && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete practice "${service.name}"?`)) {
                          deleteDemoService(service.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all"
                      title="Delete offering"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug font-heading mb-2">
                  {service.name}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-3">
                  {service.description}
                </p>

                {/* Deliverables */}
                {service.deliverables && service.deliverables.length > 0 && (
                  <div className="mb-4 pt-3 border-t border-slate-100 dark:border-[#26263A]/70 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Key Deliverables
                    </span>
                    {service.deliverables.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF9A1F] shrink-0" />
                        <span className="truncate">{d}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing Box */}
              <div className="pt-4 border-t border-slate-100 dark:border-[#26263A] mt-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Engagement Fee (HT)
                    </span>
                    <span className="text-lg font-extrabold text-[#9B30FF] font-brand">
                      {service.priceTND.toLocaleString()} TND
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      + 19% VAT ({vatAmount.toLocaleString()} TND)
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {totalTTC.toLocaleString()} TND TTC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#14141F] text-slate-900 dark:text-white border border-slate-200 dark:border-[#26263A] rounded-3xl w-full max-w-lg shadow-2xl p-6 relative">
            <h2 className="text-lg font-bold font-heading mb-4 text-white">
              Add New Consulting Offering
            </h2>

            <form onSubmit={handleAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Practice Offering Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Readiness & Automation Assessment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#26263A] bg-[#0B0B12] text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Practice Area</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#26263A] bg-[#0B0B12] text-white focus:outline-none"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Price HT (TND)</label>
                  <input
                    type="number"
                    required
                    value={priceTND}
                    onChange={(e) => setPriceTND(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#26263A] bg-[#0B0B12] text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detailed scope of executive engagement..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#26263A] bg-[#0B0B12] text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  Deliverables (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Strategic Playbook, Board Presentation, Financial Matrix"
                  value={deliverablesInput}
                  onChange={(e) => setDeliverablesInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#26263A] bg-[#0B0B12] text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#26263A]">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#26263A] hover:bg-[#1E1E2D] font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#A020F0] to-[#5B1FA8] text-white font-bold"
                >
                  Save Practice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
