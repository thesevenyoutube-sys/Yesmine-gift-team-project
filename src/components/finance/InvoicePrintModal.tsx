import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { Invoice } from '../../types';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      {/* Container */}
      <div className="bg-white text-slate-900 rounded-3xl w-full max-w-3xl shadow-2xl p-6 sm:p-8 my-8 relative">
        {/* Modal Controls - hidden when printing */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Printable PDF Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div id="printable-invoice" className="p-4 sm:p-6 bg-white text-slate-900">
          {/* Company Branding & Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                TH
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">TeamHub Inc.</h1>
                <p className="text-xs text-slate-500">Workspace & Enterprise Services</p>
                <p className="text-xs text-slate-400">billing@teamhub.com • +1 (555) 019-2834</p>
              </div>
            </div>

            <div className="text-end">
              <span className="text-2xl font-extrabold uppercase tracking-wider text-indigo-600 block">
                INVOICE
              </span>
              <span className="font-mono text-sm font-semibold text-slate-700">
                #{invoice.invoiceNumber}
              </span>
              <div className="mt-2 text-xs text-slate-500">
                <p>Status: <strong className="uppercase text-slate-800">{invoice.status}</strong></p>
              </div>
            </div>
          </div>

          {/* Dates & Billed To */}
          <div className="grid grid-cols-2 gap-8 my-6 text-xs">
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                Billed To
              </p>
              <h3 className="font-bold text-base text-slate-900">{invoice.clientName}</h3>
              {invoice.clientCompany && (
                <p className="font-medium text-slate-700">{invoice.clientCompany}</p>
              )}
              {invoice.clientEmail && <p className="text-slate-500">{invoice.clientEmail}</p>}
            </div>

            <div className="text-end space-y-1">
              <div>
                <span className="text-slate-400">Invoice Date: </span>
                <strong className="text-slate-800">{invoice.date}</strong>
              </div>
              <div>
                <span className="text-slate-400">Payment Due: </span>
                <strong className="text-slate-800">{invoice.dueDate}</strong>
              </div>
              <div>
                <span className="text-slate-400">Issued by: </span>
                <strong className="text-slate-800">{invoice.createdByName || 'TeamHub'}</strong>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden my-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-4 text-end">Unit Price</th>
                  <th className="py-3 px-4 text-end">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.description}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-3 px-4 text-end text-slate-600">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-end font-semibold text-slate-900">
                      ${item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end my-6 text-xs">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({invoice.discountPercent}%):</span>
                  <span>-${invoice.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({invoice.taxPercent}%):</span>
                  <span>+${invoice.taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-base text-slate-900">
                <span>Grand Total:</span>
                <span className="text-indigo-600">${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {invoice.notes && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 my-4">
              <strong className="block text-slate-800 font-semibold mb-1">Notes & Terms:</strong>
              <p>{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-slate-200 pt-6 mt-8 text-center text-[11px] text-slate-400">
            Thank you for your business! Please remit payment via bank transfer within the agreed terms.
          </div>
        </div>
      </div>
    </div>
  );
};
