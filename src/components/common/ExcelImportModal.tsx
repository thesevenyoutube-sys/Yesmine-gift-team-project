import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { parseSpreadsheet, validateTaskImport, validateClientImport, ParsedSheetData } from '../../lib/excel';

interface ExcelImportModalProps {
  type: 'tasks' | 'clients';
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (validRows: any[]) => Promise<void>;
  currentUser: { id: string; name: string };
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  type,
  isOpen,
  onClose,
  onImportSuccess,
  currentUser,
}) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [fileData, setFileData] = useState<ParsedSheetData | null>(null);
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<{
    valid: any[];
    invalid: { row: any; errors: string[] }[];
  }>({ valid: [], invalid: [] });
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetFields =
    type === 'tasks'
      ? [
          { key: 'title', label: 'Task Title', required: true },
          { key: 'description', label: 'Description', required: false },
          { key: 'priority', label: 'Priority (low/medium/high)', required: false },
          { key: 'status', label: 'Status (todo/doing/done)', required: false },
          { key: 'dueDate', label: 'Due Date (YYYY-MM-DD)', required: false },
        ]
      : [
          { key: 'name', label: 'Client Name', required: true },
          { key: 'company', label: 'Company', required: true },
          { key: 'email', label: 'Email', required: false },
          { key: 'phone', label: 'Phone', required: false },
          { key: 'status', label: 'Status (lead/active/closed)', required: false },
          { key: 'notes', label: 'Notes', required: false },
        ];

  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      setFileName(file.name);
      const parsed = await parseSpreadsheet(file);
      if (parsed.rows.length === 0) {
        setError('The uploaded file contains no data rows.');
        return;
      }
      setFileData(parsed);

      // Guess initial mapping
      const initialMapping: Record<string, string> = {};
      targetFields.forEach((tf) => {
        const match = parsed.headers.find(
          (h) =>
            h.toLowerCase().trim() === tf.key.toLowerCase() ||
            h.toLowerCase().includes(tf.label.toLowerCase().split(' ')[0])
        );
        if (match) initialMapping[tf.key] = match;
      });
      setMapping(initialMapping);
      setStep('mapping');
    } catch (err) {
      setError('Failed to parse spreadsheet file. Please check file format.');
    }
  };

  const handleProceedToPreview = () => {
    if (!fileData) return;

    // Validate required fields are mapped
    const missing = targetFields
      .filter((tf) => tf.required && !mapping[tf.key])
      .map((tf) => tf.label);

    if (missing.length > 0) {
      setError(`Please map required field(s): ${missing.join(', ')}`);
      return;
    }
    setError(null);

    const result =
      type === 'tasks'
        ? validateTaskImport(fileData.rows, mapping, currentUser)
        : validateClientImport(fileData.rows, mapping, currentUser);

    setValidationResult(result);
    setStep('preview');
  };

  const handleExecuteImport = async () => {
    if (validationResult.valid.length === 0) {
      setError('No valid rows found to import.');
      return;
    }

    setImporting(true);
    try {
      await onImportSuccess(validationResult.valid);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                Import {type} from Excel / CSV
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Step-by-step column mapping and schema validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 my-5 text-xs font-semibold">
          <span
            className={`px-3 py-1 rounded-full ${
              step === 'upload'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            1. Upload
          </span>
          <span className="text-slate-300 dark:text-slate-700">→</span>
          <span
            className={`px-3 py-1 rounded-full ${
              step === 'mapping'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            2. Map Columns
          </span>
          <span className="text-slate-300 dark:text-slate-700">→</span>
          <span
            className={`px-3 py-1 rounded-full ${
              step === 'preview'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            3. Preview & Errors
          </span>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="py-8">
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30">
              <UploadCloud className="w-12 h-12 text-indigo-500 mb-3" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Drop your .xlsx or .csv spreadsheet here
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Supports Excel (.xlsx, .xls) and CSV files
              </p>
              <span className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs">
                Browse File
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 'mapping' && fileData && (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                File: <strong>{fileName}</strong> ({fileData.rows.length} rows found)
              </span>
              <button
                onClick={() => setStep('upload')}
                className="text-indigo-600 hover:underline"
              >
                Change file
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {targetFields.map((field) => (
                <div
                  key={field.key}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60"
                >
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={(e) =>
                      setMapping({ ...mapping, [field.key]: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- Do not import --</option>
                    {fileData.headers.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep('upload')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleProceedToPreview}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Preview Validation <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & ERROR REPORT */}
        {step === 'preview' && (
          <div className="space-y-4 py-2">
            {/* Stats header */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">{validationResult.valid.length} Valid Rows</p>
                  <p className="text-[11px] opacity-80">Ready to insert into database</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">{validationResult.invalid.length} Invalid Rows</p>
                  <p className="text-[11px] opacity-80">Will be skipped or report errors</p>
                </div>
              </div>
            </div>

            {/* Error report table if any */}
            {validationResult.invalid.length > 0 && (
              <div className="border border-rose-200 dark:border-rose-900/60 rounded-2xl overflow-hidden text-xs">
                <div className="bg-rose-100/60 dark:bg-rose-950/60 px-3.5 py-2 font-semibold text-rose-900 dark:text-rose-200">
                  Validation Error Details ({validationResult.invalid.length})
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-rose-100 dark:divide-rose-900/30 p-2 bg-white dark:bg-slate-900">
                  {validationResult.invalid.map((item, idx) => (
                    <div key={idx} className="py-1.5 px-2 text-rose-700 dark:text-rose-300">
                      <strong>Row {idx + 1}:</strong> {item.errors.join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid preview sample */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 px-3.5 py-2 font-semibold text-slate-700 dark:text-slate-300">
                Sample Valid Records (showing first 5)
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {validationResult.valid.slice(0, 5).map((row, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="font-medium truncate max-w-xs">
                      {row.title || row.name}
                    </span>
                    <span className="text-slate-400 capitalize text-[11px]">
                      {row.priority || row.company || row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep('mapping')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Mapping
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={validationResult.valid.length === 0 || importing}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {importing
                  ? 'Importing...'
                  : `Confirm Import (${validationResult.valid.length} items)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
