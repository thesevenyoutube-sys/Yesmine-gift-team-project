import * as XLSX from 'xlsx';

export interface ColumnMapping {
  fileColumn: string;
  targetField: string;
}

export interface ValidationError {
  rowIndex: number;
  field: string;
  message: string;
}

export interface ParsedSheetData {
  headers: string[];
  rows: Record<string, any>[];
}

/**
 * Export any dataset to a downloaded .xlsx file
 */
export function exportToExcel(
  data: Record<string, any>[],
  filename: string,
  sheetName: string = 'Sheet1'
) {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Parse an uploaded .xlsx or .csv file into JSON
 */
export async function parseSpreadsheet(file: File): Promise<ParsedSheetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '',
        });

        // Extract header columns
        let headers: string[] = [];
        if (jsonRows.length > 0) {
          headers = Object.keys(jsonRows[0]);
        } else {
          // Fallback to range
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
            if (cell && cell.v) headers.push(String(cell.v));
          }
        }

        resolve({ headers, rows: jsonRows });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validates and maps rows for Task import
 */
export function validateTaskImport(
  rows: Record<string, any>[],
  mapping: Record<string, string>, // targetField -> fileColumn
  currentUser: { id: string; name: string }
): { valid: any[]; invalid: { row: any; errors: string[] }[] } {
  const valid: any[] = [];
  const invalid: { row: any; errors: string[] }[] = [];

  rows.forEach((row, index) => {
    const errors: string[] = [];
    const titleCol = mapping['title'];
    const title = titleCol ? String(row[titleCol] || '').trim() : '';

    if (!title) {
      errors.push('Task Title is required');
    }

    const priorityCol = mapping['priority'];
    let priority = priorityCol ? String(row[priorityCol] || '').toLowerCase().trim() : 'medium';
    if (!['low', 'medium', 'high'].includes(priority)) {
      priority = 'medium';
    }

    const statusCol = mapping['status'];
    let status = statusCol ? String(row[statusCol] || '').toLowerCase().trim() : 'todo';
    if (!['todo', 'doing', 'done'].includes(status)) {
      status = 'todo';
    }

    const dueDateCol = mapping['dueDate'];
    let dueDate = dueDateCol ? String(row[dueDateCol] || '').trim() : '';
    if (!dueDate) {
      dueDate = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
    }

    const descCol = mapping['description'];
    const description = descCol ? String(row[descCol] || '').trim() : '';

    if (errors.length > 0) {
      invalid.push({ row, errors });
    } else {
      valid.push({
        title,
        description,
        priority,
        status,
        dueDate,
        assigneeId: currentUser.id,
        assigneeName: currentUser.name,
      });
    }
  });

  return { valid, invalid };
}

/**
 * Validates and maps rows for Client import
 */
export function validateClientImport(
  rows: Record<string, any>[],
  mapping: Record<string, string>, // targetField -> fileColumn
  currentUser: { id: string; name: string }
): { valid: any[]; invalid: { row: any; errors: string[] }[] } {
  const valid: any[] = [];
  const invalid: { row: any; errors: string[] }[] = [];

  rows.forEach((row, index) => {
    const errors: string[] = [];
    const nameCol = mapping['name'];
    const name = nameCol ? String(row[nameCol] || '').trim() : '';
    if (!name) errors.push('Client Name is required');

    const companyCol = mapping['company'];
    const company = companyCol ? String(row[companyCol] || '').trim() : '';
    if (!company) errors.push('Company is required');

    const emailCol = mapping['email'];
    const email = emailCol ? String(row[emailCol] || '').trim() : '';

    const phoneCol = mapping['phone'];
    const phone = phoneCol ? String(row[phoneCol] || '').trim() : '';

    const statusCol = mapping['status'];
    let status = statusCol ? String(row[statusCol] || '').toLowerCase().trim() : 'lead';
    if (!['lead', 'active', 'closed'].includes(status)) {
      status = 'lead';
    }

    const notesCol = mapping['notes'];
    const notes = notesCol ? String(row[notesCol] || '').trim() : '';

    if (errors.length > 0) {
      invalid.push({ row, errors });
    } else {
      valid.push({
        name,
        company,
        email,
        phone,
        status,
        notes,
        ownerId: currentUser.id,
        ownerName: currentUser.name,
      });
    }
  });

  return { valid, invalid };
}
