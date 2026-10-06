import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { NotificationItem } from '../types';

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: 'task' | 'message' | 'invoice' | 'system' = 'system',
  link?: string
) {
  try {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const notification: NotificationItem = {
      id,
      userId,
      title,
      message,
      type,
      read: false,
      link: link || '',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'notifications', id), notification);
  } catch (err) {
    console.warn('Failed to send notification:', err);
  }
}
