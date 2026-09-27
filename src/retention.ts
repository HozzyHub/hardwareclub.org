// Submission timestamps are ISO UTC strings, so their lexical order matches time order.
export function retentionCutoff(now: Date): string {
  const cutoff = new Date(now);
  const day = cutoff.getUTCDate();
  cutoff.setUTCDate(1);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  const daysInMonth = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate();
  cutoff.setUTCDate(Math.min(day, daysInMonth));
  return cutoff.toISOString();
}

export async function purgeExpiredSubmissions(db: D1Database, now: Date): Promise<number> {
  const result = await db.prepare("DELETE FROM submissions WHERE created_at < ?")
    .bind(retentionCutoff(now))
    .run();
  return result.meta.changes;
}
