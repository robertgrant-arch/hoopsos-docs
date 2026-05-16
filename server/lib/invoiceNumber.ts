/**
 * Generates a sequential human-readable invoice number for an org.
 * Format: INV-{YEAR}-{4-digit-seq}
 * Uses a simple count-based approach; replace with a DB sequence for production.
 */
import { getDb } from "@shared/db";
import { invoices } from "@shared/db";
import { eq, sql } from "drizzle-orm";

export async function generateInvoiceNumber(orgId: string): Promise<string> {
  const db = getDb();
  const year = new Date().getFullYear();

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invoices)
    .where(eq(invoices.orgId, orgId));

  const seq = (result?.count ?? 0) + 1;
  return `INV-${year}-${String(seq).padStart(4, "0")}`;
}
