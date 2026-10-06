import { doc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { AuditLog } from '../types';

export async function logAuditEvent(
  action: string,
  module: string,
  details: string,
  targetId?: string
) {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const log: AuditLog = {
      id: logId,
      action,
      module,
      targetId: targetId || '',
      details,
      userId: user.uid,
      userName: user.displayName || user.email || 'Team Member',
      userRole: 'member', // will be evaluated
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'audit_logs', logId), log);
  } catch (err) {
    // Non-blocking for UI, but logs defensive error
    console.warn('Audit log write error:', err);
  }
}
