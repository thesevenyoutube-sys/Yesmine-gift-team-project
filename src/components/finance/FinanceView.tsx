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
  Receipt,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Printer,
  FileSpreadsheet,
  Trash2,
  CheckCircle,
  AlertCircle,
  Search,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDemo } from '../../contexts/DemoContext';
import { Invoice, InvoiceLineItem, Expense, ExpenseCategory, Client } from '../../types';
import { exportToExcel } from '../../lib/excel';
import { InvoicePrintModal } from './InvoicePrintModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { logAuditEvent } from '../../lib/audit';

export const FinanceView: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const {
    isDemoMode,
    demoInvoices,
    demoExpenses,
    demoClients,
    addDemoInvoice,
    updateDemoInvoiceStatus,
    deleteDemoInvoice,
    addDemoExpense,
  } = useDemo();
  const { t } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'expenses' | 'analytics'>('invoices');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [printInvoiceTarget, setPrintInvoiceTarget] = useState<Invoice | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form State: Invoice
  const [invoiceClientId, setInvoiceClientId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState(
    new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]
  );
  const [taxPercent, setTaxPercent] = useState<number>(19);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { id: '1', description: 'Strategic Advisory & Consultation', quantity: 1, unitPrice: 15000, total: 15000 },
  ]);

  // Form State: Expense
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Software');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Subscriptions
  useEffect(() => {
    if (isDemoMode) {
      setInvoices(demoInvoices);
      setExpenses(demoExpenses);
      setClients(demoClients);
      setLoading(false);
      return;
    }

    if (!userProfile) return;

    const unsubInvoices = onSnapshot(
      collection(db, 'invoices'),
      (snap) => {
        const list: Invoice[] = [];
        const today = new Date().toISOString().split('T')[0];

        snap.forEach((d) => {
          const inv = { id: d.id, ...(d.data() as any) } as Invoice;
          // Auto-mark overdue if past due date and not paid
          if (inv.status !== 'paid' && inv.dueDate < today && inv.status !== 'overdue') {
            inv.status = 'overdue';
          }
          list.push(inv);
        });
        setInvoices(list);
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'invoices')
    );

    const unsubExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snap) => {
        const list: Expense[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setExpenses(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'expenses')
    );

    const unsubClients = onSnapshot(
      collection(db, 'clients'),
      (snap) => {
        const list: Client[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setClients(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'clients')
    );

    return () => {
      unsubInvoices();
      unsubExpenses();
      unsubClients();
    };
  }, [userProfile, isDemoMode, demoInvoices, demoExpenses, demoClients]);

  // Calculations
  const calculateSubtotal = () =>
    lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice || 0), 0);

  const calculateGrandTotal = () => {
    const sub = calculateSubtotal();
    const discount = (sub * (discountPercent || 0)) / 100;
    const taxable = sub - discount;
    const tax = (taxable * (taxPercent || 0)) / 100;
    return sub - discount + tax;
  };

  const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, val: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(val) : updated[index].quantity;
      const u = field === 'unitPrice' ? Number(val) : updated[index].unitPrice;
      updated[index].total = q * u;
    }
    setLineItems(updated);
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: String(Date.now()), description: '', quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceClientId) return;

    const client = clients.find((c) => c.id === invoiceClientId);
    const subtotal = calculateSubtotal();
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxAmount = ((subtotal - discountAmount) * taxPercent) / 100;
    const total = subtotal - discountAmount + taxAmount;

    const nextNum = `SBC-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const id = `inv_${Date.now()}`;

    const newInvoice: Invoice = {
      id,
      invoiceNumber: nextNum,
      clientId: invoiceClientId,
      clientName: client?.name || 'Client',
      clientCompany: client?.company || '',
      clientEmail: client?.email || '',
      date: invoiceDate,
      dueDate: invoiceDueDate,
      status: 'draft',
      lineItems,
      subtotal,
      taxPercent,
      taxAmount,
      discountPercent,
      discountAmount,
      total,
      notes: invoiceNotes,
      createdBy: userProfile?.id || 'demo_user_1',
      createdByName: userProfile?.name || 'Demo Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      addDemoInvoice(newInvoice);
      setIsInvoiceModalOpen(false);
      setLineItems([{ id: '1', description: 'Strategic Advisory & Consultation', quantity: 1, unitPrice: 15000, total: 15000 }]);
      return;
    }

    try {
      await setDoc(doc(db, 'invoices', id), newInvoice);
      await logAuditEvent('invoice_created', 'finance', `Created invoice #${nextNum} (${total.toFixed(2)} TND)`, id);
      setIsInvoiceModalOpen(false);
      // Reset
      setLineItems([{ id: '1', description: 'Consulting Services', quantity: 1, unitPrice: 1000, total: 1000 }]);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `invoices/${id}`);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount) return;

    const id = `exp_${Date.now()}`;
    const newExpense: Expense = {
      id,
      description: expenseDesc,
      amount: Number(expenseAmount),
      category: expenseCategory,
      date: expenseDate,
      recordedBy: userProfile?.id || 'demo_user_1',
      recorderName: userProfile?.name || 'Demo Admin',
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      addDemoExpense(newExpense);
      setIsExpenseModalOpen(false);
      setExpenseDesc('');
      setExpenseAmount(0);
      return;
    }

    try {
      await setDoc(doc(db, 'expenses', id), newExpense);
      await logAuditEvent('expense_recorded', 'finance', `Recorded expense "${expenseDesc}" (${expenseAmount} TND)`, id);
      setIsExpenseModalOpen(false);
      setExpenseDesc('');
      setExpenseAmount(0);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `expenses/${id}`);
    }
  };

  const handleUpdateStatus = async (invoice: Invoice, newStatus: Invoice['status']) => {
    if (isDemoMode) {
      updateDemoInvoiceStatus(invoice.id, newStatus);
      return;
    }

    try {
      await updateDoc(doc(db, 'invoices', invoice.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      await logAuditEvent('invoice_status_changed', 'finance', `Invoice #${invoice.invoiceNumber} marked as ${newStatus}`, invoice.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${invoice.id}`);
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`Delete invoice #${invoice.invoiceNumber}?`)) return;

    if (isDemoMode) {
      deleteDemoInvoice(invoice.id);
      return;
    }

    try {
      await deleteDoc(doc(db, 'invoices', invoice.id));
      await logAuditEvent('invoice_deleted', 'finance', `Deleted invoice #${invoice.invoiceNumber}`, invoice.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `invoices/${invoice.id}`);
    }
  };

  // Export tables to .xlsx
  const handleExportInvoices = () => {
    const data = invoices.map((inv) => ({
      InvoiceNumber: inv.invoiceNumber,
      Client: inv.clientName,
      Company: inv.clientCompany,
      Date: inv.date,
      DueDate: inv.dueDate,
      Status: inv.status.toUpperCase(),
      Subtotal: `${inv.subtotal} TND`,
      TaxPercent: `${inv.taxPercent}%`,
      DiscountPercent: `${inv.discountPercent}%`,
      Total: `${inv.total} TND`,
    }));
    exportToExcel(data, `Safran_Invoices_${new Date().toISOString().split('T')[0]}`, 'Invoices');
  };

  const handleExportExpenses = () => {
    const data = expenses.map((exp) => ({
      Description: exp.description,
      Amount: exp.amount,
      Category: exp.category,
      Date: exp.date,
      RecordedBy: exp.recorderName,
    }));
    exportToExcel(data, `TeamHub_Expenses_${new Date().toISOString().split('T')[0]}`, 'Expenses');
  };

  // Financial aggregates
  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((a, b) => a + b.total, 0);
  const unpaidTotal = invoices.filter((i) => i.status !== 'paid').reduce((a, b) => a + b.total, 0);
  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || inv.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  if (loading) {
    return <LoadingSpinner message="Loading finance & billing..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Invoices & Finance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Billing management, printable PDF invoices, expense tracking & financial metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <TrendingDown className="w-4 h-4 text-rose-500" /> Record Expense
          </button>
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Paid Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">From settled client invoices</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Unpaid / Outstanding</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ${unpaidTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-amber-600 mt-1 font-medium">Pending or sent invoices</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-rose-600 mt-1 font-medium">Operational & contractor costs</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Net Profit</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
            ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Revenue minus expenses</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'invoices'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'expenses'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Financial Analytics
          </button>
        </div>

        {activeSubTab === 'invoices' && (
          <button
            onClick={handleExportInvoices}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export to Excel
          </button>
        )}
        {activeSubTab === 'expenses' && (
          <button
            onClick={handleExportExpenses}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export to Excel
          </button>
        )}
      </div>

      {/* SUBTAB 1: INVOICES LIST */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search invoice # or client..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {['All', 'Draft', 'Sent', 'Paid', 'Overdue'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Invoices Found"
              description="Create your first client invoice to initiate professional billing."
              actionText="New Invoice"
              onAction={() => setIsInvoiceModalOpen(true)}
            />
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-3">Date</th>
                    <th className="py-3.5 px-3">Due Date</th>
                    <th className="py-3.5 px-4 text-end">Total</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                    <th className="py-3.5 px-4 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {inv.clientName}
                        </p>
                        {inv.clientCompany && (
                          <p className="text-[11px] text-slate-400">{inv.clientCompany}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">{inv.date}</td>
                      <td className="py-3.5 px-3 text-slate-500">{inv.dueDate}</td>
                      <td className="py-3.5 px-4 text-end font-bold text-slate-900 dark:text-white">
                        ${inv.total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <select
                          value={inv.status}
                          onChange={(e) => handleUpdateStatus(inv, e.target.value as any)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wider focus:outline-none ${
                            inv.status === 'paid'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                              : inv.status === 'sent'
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 text-indigo-700 dark:text-indigo-300'
                              : inv.status === 'overdue'
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <option value="draft">DRAFT</option>
                          <option value="sent">SENT</option>
                          <option value="paid">PAID</option>
                          <option value="overdue">OVERDUE</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPrintInvoiceTarget(inv)}
                            title="Print / PDF with Logo"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {(isAdmin || inv.createdBy === userProfile?.id) && (
                            <button
                              onClick={() => handleDeleteInvoice(inv)}
                              title="Delete Invoice"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
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
        </div>
      )}

      {/* SUBTAB 2: EXPENSES */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-4">
          {expenses.length === 0 ? (
            <EmptyState
              icon={TrendingDown}
              title="No Expenses Logged"
              description="Track company expenses, software subscriptions, office supplies, and contractor payouts."
              actionText="Record Expense"
              onAction={() => setIsExpenseModalOpen(true)}
            />
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-3">Date</th>
                    <th className="py-3.5 px-4">Recorded By</th>
                    <th className="py-3.5 px-4 text-end">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {exp.description}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">{exp.date}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {exp.recorderName}
                      </td>
                      <td className="py-3.5 px-4 text-end font-bold text-rose-600 dark:text-rose-400">
                        -${exp.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: FINANCIAL ANALYTICS & CHARTS */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue vs Expenses Comparison Bar Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Revenue & Expense Breakdown
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-emerald-600">Settled Revenue</span>
                  <span>${totalRevenue.toFixed(2)}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${totalRevenue + totalExpenses > 0 ? (totalRevenue / (totalRevenue + totalExpenses)) * 100 : 50}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-rose-600">Expenses</span>
                  <span>${totalExpenses.toFixed(2)}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{
                      width: `${totalRevenue + totalExpenses > 0 ? (totalExpenses / (totalRevenue + totalExpenses)) * 100 : 50}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-amber-600">Uncollected / Pending</span>
                  <span>${unpaidTotal.toFixed(2)}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Expense Categories Distribution */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Expenses by Category
            </h3>
            <div className="space-y-3">
              {(['Software', 'Office', 'Travel', 'Marketing', 'Contractor', 'Other'] as ExpenseCategory[]).map(
                (cat) => {
                  const sum = expenses.filter((e) => e.category === cat).reduce((a, b) => a + b.amount, 0);
                  const pct = totalExpenses > 0 ? Math.round((sum / totalExpenses) * 100) : 0;
                  return (
                    <div key={cat} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 w-24">{cat}</span>
                      <div className="flex-1 mx-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 min-w-16 text-end">
                        ${sum.toFixed(2)} ({pct}%)
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl p-6 my-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Create New Invoice
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Auto-numbered invoice with customizable line items, tax and discounts
            </p>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Client *
                  </label>
                  <select
                    required
                    value={invoiceClientId}
                    onChange={(e) => setInvoiceClientId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">Select Client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceDueDate}
                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Line items list */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Line Items
                </label>
                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Item description..."
                        value={item.description}
                        onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-16 text-xs px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => handleLineItemChange(idx, 'unitPrice', Number(e.target.value))}
                        className="w-24 text-xs px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-end"
                      />
                      <span className="w-20 text-xs font-semibold text-end text-slate-900 dark:text-white">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        disabled={lineItems.length === 1}
                        className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Item
                </button>
              </div>

              {/* Tax & Discount */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tax (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Total display */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center text-sm font-bold">
                <span>Calculated Total:</span>
                <span className="text-indigo-600 dark:text-indigo-400 text-base">
                  ${calculateGrandTotal().toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes or Bank Details
                </label>
                <textarea
                  rows={2}
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="Payment instructions, bank wire info, or friendly notes..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Create & Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Record Operational Expense
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Track business expenditures and categorize them
            </p>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="AWS Cloud Hosting, Adobe Creative Cloud, Travel..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={expenseAmount || ''}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Software">Software</option>
                    <option value="Office">Office</option>
                    <option value="Travel">Travel</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Legal">Legal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE INVOICE MODAL */}
      <InvoicePrintModal
        invoice={printInvoiceTarget}
        onClose={() => setPrintInvoiceTarget(null)}
      />
    </div>
  );
};
