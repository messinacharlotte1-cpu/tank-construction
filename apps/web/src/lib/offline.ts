// File d'écritures offline (terrain). Idempotence via uuid client. Rejouée à la reconnexion.
const KEY = "tank_pointage_queue";

type QueuedPointage = Record<string, unknown> & { id: string };

export function queuePointage(record: QueuedPointage) {
  const q = readQueue();
  q.push(record);
  localStorage.setItem(KEY, JSON.stringify(q));
}

export function pendingCount(): number {
  return readQueue().length;
}

function readQueue(): QueuedPointage[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

// Rejoue la file ; garde les échecs. Retourne le nombre synchronisé.
export async function flushPointages(
  insertFn: (rec: QueuedPointage) => Promise<{ error: unknown }>,
): Promise<number> {
  const q = readQueue();
  if (q.length === 0) return 0;
  const remain: QueuedPointage[] = [];
  for (const rec of q) {
    const { error } = await insertFn(rec);
    if (error) remain.push(rec);
  }
  localStorage.setItem(KEY, JSON.stringify(remain));
  return q.length - remain.length;
}
