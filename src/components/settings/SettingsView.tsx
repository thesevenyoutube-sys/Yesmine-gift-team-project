import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  FileText,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  Save,
  Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Logo } from '../common/Logo';

export const SettingsView: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [firmName, setFirmName] = useState('Safran Business Consulting');
  const [hqAddress, setHqAddress] = useState('Tour Incity, 116 Cours Lafayette, 69003 Lyon, France');
  const [taxId, setTaxId] = useState('FR 49 849 203 102');
  const [billingEmail, setBillingEmail] = useState('finance@safran-consulting.com');
  const [currency, setCurrency] = useState('USD ($)');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B0B12] dark:text-[#F4F1FF] flex items-center gap-2 font-heading">
          <SettingsIcon className="w-6 h-6 text-[#9B30FF]" />
          Firm Settings & Operating Configuration
        </h1>
        <p className="text-sm text-[#6B6B80] dark:text-slate-400">
          Corporate governance parameters, billing terms, visual identity and localization
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand Preview Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#14141F] border border-[#EFE7FF] dark:border-[#26263A] shadow-md">
          <h3 className="font-bold text-sm text-[#0B0B12] dark:text-[#F4F1FF] mb-3 font-heading">
            Corporate Identity Preview
          </h3>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0B12] border border-slate-200 dark:border-[#26263A] flex items-center justify-between">
            <Logo size="lg" />
            <div className="text-right text-xs text-[#6B6B80] dark:text-slate-400">
              <span className="font-semibold block text-[#9B30FF]">Official Advisory Entity</span>
              <span>Enterprise Identifier: SBC-GLOBAL</span>
            </div>
          </div>
        </div>

        {/* Firm Profile Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#14141F] border border-[#EFE7FF] dark:border-[#26263A] shadow-md space-y-4">
          <h3 className="font-bold text-sm text-[#0B0B12] dark:text-[#F4F1FF] font-heading flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#9B30FF]" /> Firm Profile & Legal Registration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Legal Entity Name
              </label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#26263A] bg-slate-50 dark:bg-[#0B0B12] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tax Registration / VAT ID
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#26263A] bg-slate-50 dark:bg-[#0B0B12] text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Headquarters Address
            </label>
            <input
              type="text"
              value={hqAddress}
              onChange={(e) => setHqAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#26263A] bg-slate-50 dark:bg-[#0B0B12] text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Financial & Billing Preferences */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#14141F] border border-[#EFE7FF] dark:border-[#26263A] shadow-md space-y-4">
          <h3 className="font-bold text-sm text-[#0B0B12] dark:text-[#F4F1FF] font-heading flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#FF9A1F]" /> Financial Billing & Payment Defaults
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Billing Support Email
              </label>
              <input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#26263A] bg-slate-50 dark:bg-[#0B0B12] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#26263A] bg-slate-50 dark:bg-[#0B0B12] text-slate-900 dark:text-white"
              >
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="GBP (£)">GBP (£)</option>
                <option value="AED (AED)">AED (AED)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="text-xs font-semibold text-[#22C55E] flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Changes successfully saved
            </span>
          )}
          <button
            type="submit"
            className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#A020F0] to-[#5B1FA8] hover:from-[#B030F5] hover:to-[#6A1BB1] text-white text-xs font-bold rounded-xl shadow-lg glow-purple transition-all"
          >
            <Save className="w-4 h-4" /> Save Operating Settings
          </button>
        </div>
      </form>
    </div>
  );
};
