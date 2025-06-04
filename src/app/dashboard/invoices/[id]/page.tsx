import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/gst-calculations";
import InvoicePdfButton from "./pdf-button";
import { PaymentStatusBadge } from "@/components/ui/payment-status-badge";
import PaymentButton from "./payment-button";

// Update the getInvoice function to include the new fields
async function getInvoice(id: string, userId: string) {
  const invoice = await db.invoice.findUnique({
    where: {
      id,
      userId,
    },
    include: {
      customer: true,
      items: true,
      user: true, // Include user to get business details
    },
  });

  return invoice;
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  const userId = session.user.id;
  const invoice = await getInvoice(params.id, userId);

  if (!invoice) {
    notFound();
  }

  // Update the invoice display to include the new fields and make it more professional
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
        <div className="space-x-4">
          <InvoicePdfButton invoice={invoice} />
          <Link
            href={`/dashboard/invoices/${invoice.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit Invoice
          </Link>
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Invoices
          </Link>
        </div>
      </div>

      <div id="invoice-container" className="bg-white p-8 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
          </div>
          <div className="text-right">
            {/* Replace with your company logo */}
            <div className="text-xl font-bold text-gray-800">{invoice.user?.businessName || "Your Company"}</div>
          </div>
        </div>

        <div className="flex justify-between mb-8">
          <div>
            <p className="text-gray-600 mb-1"><span className="font-semibold">Invoice Number:</span> {invoice.invoiceNumber}</p>
            <p className="text-gray-600 mb-1">
              <span className="font-semibold">Invoice Date:</span> {new Date(invoice.invoiceDate).toLocaleDateString()}
            </p>
            {invoice.dueDate && (
              <p className="text-gray-600 mb-1">
                <span className="font-semibold">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end space-x-2 mb-2">
              <span className="font-semibold">Status:</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {invoice.status}
              </span>
            </div>
            <div className="flex items-center justify-end space-x-2">
              <span className="font-semibold">Payment:</span>
              <PaymentStatusBadge status={invoice.paymentStatus} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-gray-700 mb-2">From:</h3>
            <p className="text-gray-700 font-semibold mb-1">{invoice.user?.businessName || "Your Company Name"}</p>
            <p className="text-gray-600 mb-1">{invoice.user?.businessAddress || "Your Address"}</p>
            <p className="text-gray-600 mb-1">GSTIN: {invoice.user?.businessGST || "Your GST Number"}</p>
            <p className="text-gray-600 mb-1">Email: {invoice.user?.businessEmail || invoice.user?.email || "Your Email"}</p>
            <p className="text-gray-600">Phone: {invoice.user?.businessPhone || "Your Phone"}</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-700 mb-2">To:</h3>
            <p className="text-gray-700 font-semibold mb-1">{invoice.customer.name}</p>
            <p className="text-gray-600 mb-1">{invoice.customer.address}</p>
            {invoice.customer.gstNumber && (
              <p className="text-gray-600 mb-1">GSTIN: {invoice.customer.gstNumber}</p>
            )}
            {invoice.customer.email && (
              <p className="text-gray-600 mb-1">Email: {invoice.customer.email}</p>
            )}
            {invoice.customer.phone && (
              <p className="text-gray-600">Phone: {invoice.customer.phone}</p>
            )}
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200 mb-8">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                GST %
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoice.items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {item.description}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {formatCurrency(item.rate)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {item.gstRate}%
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between py-2">
              <span className="font-medium">Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            
            {/* Display discount if present */}
            {invoice.discount > 0 && (
              <div className="flex justify-between py-2 text-red-600">
                <span className="font-medium">Discount:</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            
            {/* Display shipping if present */}
            {invoice.shippingCharges > 0 && (
              <div className="flex justify-between py-2">
                <span className="font-medium">Shipping:</span>
                <span>{formatCurrency(invoice.shippingCharges)}</span>
              </div>
            )}
            
            {invoice.isSameState ? (
              <>
                <div className="flex justify-between py-2">
                  <span className="font-medium">CGST:</span>
                  <span>{formatCurrency(invoice.cgst)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-medium">SGST:</span>
                  <span>{formatCurrency(invoice.sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between py-2">
                <span className="font-medium">IGST:</span>
                <span>{formatCurrency(invoice.igst)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add to your imports
import { PaymentStatusBadge } from "@/components/ui/payment-status-badge";
import PaymentButton from "./payment-button";

// In your component, add payment status display and payment button
// This is just a snippet to add to your existing page

// Add this near where you display invoice status
<div className="flex items-center space-x-2 mb-4">
  <span className="text-gray-500">Payment Status:</span>
  <PaymentStatusBadge status={invoice.paymentStatus} />
</div>

// Add this at the bottom of your invoice details section
<div className="mt-6 border-t pt-6">
  <h3 className="text-lg font-medium mb-4">Payment Options</h3>
  <PaymentButton 
    invoiceId={invoice.id} 
    total={Number(invoice.total)} 
    status={invoice.paymentStatus} 
  />
</div>