import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function getInvoiceStats(userId: string) {
  const totalInvoices = await db.invoice.count({
    where: { userId },
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0);

  const thisMonthInvoices = await db.invoice.count({
    where: {
      userId,
      invoiceDate: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    },
  });

  return { totalInvoices, thisMonthInvoices };
}

async function getRecentInvoices(userId: string) {
  return await db.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { customer: true },
  });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  const userId = session.user.id;
  const { totalInvoices, thisMonthInvoices } = await getInvoiceStats(userId);
  const recentInvoices = await getRecentInvoices(userId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Welcome, {session.user.name || "User"}!</h1>
        <div className="space-x-4">
          <Link
            href="/dashboard/invoices/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Invoice
          </Link>
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View All Invoices
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">Total Invoices</p>
              <p className="text-2xl font-bold">{totalInvoices}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold">{thisMonthInvoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/dashboard/invoices/create"
              className="bg-indigo-50 p-4 rounded-md text-center hover:bg-indigo-100"
            >
              <p className="text-indigo-700 font-medium">Create Invoice</p>
            </Link>
            <Link
              href="/dashboard/customers/create"
              className="bg-green-50 p-4 rounded-md text-center hover:bg-green-100"
            >
              <p className="text-green-700 font-medium">Add Customer</p>
            </Link>
            <Link
              href="/dashboard/invoices"
              className="bg-blue-50 p-4 rounded-md text-center hover:bg-blue-100"
            >
              <p className="text-blue-700 font-medium">View Invoices</p>
            </Link>
            <Link
              href="/dashboard/customers"
              className="bg-purple-50 p-4 rounded-md text-center hover:bg-purple-100"
            >
              <p className="text-purple-700 font-medium">View Customers</p>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Invoices</h2>
          <Link
            href="/dashboard/invoices"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            View all
          </Link>
        </div>

        {recentInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(invoice.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ₹{Number(invoice.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === "Generated"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No invoices yet. Create your first invoice!</p>
            <Link
              href="/dashboard/invoices/create"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Invoice
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}