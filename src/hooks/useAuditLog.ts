import { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  actorRole: string;
  target?: string;
  details?: string;
  timestamp: Date;
}

export const logAudit = async (action: string, actor: string, actorRole: string, target?: string, details?: string) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      actor,
      actorRole,
      target: target || null,
      details: details || null,
      timestamp: Timestamp.now(),
    });
  } catch (e) {
    console.error('Failed to log audit:', e);
  }
};

export const useAuditLog = (maxEntries = 50) => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(maxEntries));
    const unsub = onSnapshot(q, (snap) => {
      const logs: AuditEntry[] = [];
      snap.forEach(d => {
        const data = d.data();
        logs.push({
          id: d.id,
          action: data.action,
          actor: data.actor,
          actorRole: data.actorRole,
          target: data.target,
          details: data.details,
          timestamp: data.timestamp?.toDate?.() || new Date(),
        });
      });
      setEntries(logs);
      setLoading(false);
    });
    return unsub;
  }, [maxEntries]);

  return { entries, loading };
};
