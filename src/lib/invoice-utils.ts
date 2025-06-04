import { db } from "./db";

export async function generateInvoiceNumber(userId: string) {
  // Get the current financial year
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = today.getFullYear();
  
  // In India, financial year runs from April 1 to March 31
  const financialYear = currentMonth >= 4 
    ? `${currentYear}-${(currentYear + 1).toString().slice(2)}` 
    : `${currentYear - 1}-${currentYear.toString().slice(2)}`;
  
  // Count existing invoices for this user in the current financial year
  const startDate = new Date(currentMonth >= 4 ? currentYear : currentYear - 1, 3, 1); // April 1
  const endDate = new Date(currentMonth >= 4 ? currentYear + 1 : currentYear, 2, 31); // March 31
  
  const invoiceCount = await db.invoice.count({
    where: {
      userId,
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  
  // Generate the invoice number (INV-FY-XXXX format)
  const nextNumber = (invoiceCount + 1).toString().padStart(4, '0');
  return `INV-${financialYear}-${nextNumber}`;
}