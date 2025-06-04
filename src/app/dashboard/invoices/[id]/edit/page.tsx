"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateGST, calculateTotal, formatCurrency } from "@/lib/gst-calculations";

// Define the form schema using Zod
const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0, "Rate must be a positive number"),
  gstRate: z.number().min(0, "GST rate must be a positive number"),
});

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  isSameState: z.boolean().default(true),
  status: z.string(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

type Customer = {
  id: string;
  name: string;
  gstNumber?: string;
  address: string;
};

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  gstRate: number;
  amount: number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  customerId: string;
  isSameState: boolean;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  status: string;
  items: InvoiceItem[];
};

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [subtotal, setSubtotal] = useState(0);
  const [gstValues, setGstValues] = useState({ cgst: 0, sgst: 0, igst: 0 });
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: "",
      invoiceDate: "",
      dueDate: "",
      customerId: "",
      isSameState: true,
      status: "Generated",
      items: [{ description: "", quantity: 1, rate: 0, gstRate: 18 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchIsSameState = watch("isSameState");

  // Fetch invoice data and customers on component mount
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${params.id}`);
        const data = await response.json();

        if (response.ok) {
          setInvoice(data.invoice);
          
          // Format the date strings for the form
          const invoiceDate = new Date(data.invoice.invoiceDate)
            .toISOString()
            .split("T")[0];
          
          const dueDate = data.invoice.dueDate
            ? new Date(data.invoice.dueDate).toISOString().split("T")[0]
            : "";

          // Reset the form with the invoice data
          reset({
            invoiceNumber: data.invoice.invoiceNumber,
            invoiceDate,
            dueDate,
            customerId: data.invoice.customerId,
            isSameState: data.invoice.isSameState,
            status: data.invoice.status,
            items: data.invoice.items.map((item: any) => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              gstRate: item.gstRate,
            })),
          });

          setSubtotal(data.invoice.subtotal);
          setGstValues({
            cgst: data.invoice.cgst,
            sgst: data.invoice.sgst,
            igst: data.invoice.igst,
          });
          setTotal(data.invoice.total);
        } else {
          setError("Failed to load invoice");
        }
      } catch (error) {
        setError("Failed to load invoice");
      }
    };

    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        const data = await response.json();

        if (response.ok) {
          setCustomers(data.customers);
        } else {
          setError("Failed to load customers");
        }
      } catch (error) {
        setError("Failed to load customers");
      }
    };

    fetchInvoice();
    fetchCustomers();
  }, [params.id, reset]);

  // Calculate subtotal, GST, and total whenever items or isSameState changes
  useEffect(() => {
    if (!watchItems?.length) return;

    // Calculate subtotal
    const calculatedSubtotal = watchItems.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const rate = item.rate || 0;
      return sum + quantity * rate;
    }, 0);

    // Calculate GST
    const gstAmounts = calculateGST(
      calculatedSubtotal,
      watchItems.map((item) => ({
        quantity: item.quantity || 0,
        rate: item.rate || 0,
        gstRate: item.gstRate || 0,
      })),
      watchIsSameState
    );

    // Calculate total
    const calculatedTotal = calculateTotal(
      calculatedSubtotal,
      gstAmounts.cgst,
      gstAmounts.sgst,
      gstAmounts.igst
    );

    setSubtotal(calculatedSubtotal);
    setGstValues(gstAmounts);
    setTotal(calculatedTotal);
  }, [watchItems, watchIsSameState]);

  const onSubmit = async (data: InvoiceFormValues) => {
    setIsLoading(true);
    setError("");

    try {
      // Add calculated values to the form data
      const invoiceData = {
        ...data,
        subtotal,
        cgst: gstValues.cgst,
        sgst: gstValues.sgst,
        igst: gstValues.igst,
        total,
        // Add amount to each item
        items: data.items.map((item) => ({
          ...item,
          amount: (item.quantity || 0) * (item.rate || 0),
        })),
      };

      const response = await fetch(`/api/invoices/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/dashboard/invoices/${params.id}`);
      } else {
        setError(result.error || "Failed to update invoice");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!invoice && !error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading invoice...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit Invoice</h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <Input
                {...register("invoiceNumber")}
                disabled
                className="bg-gray-50"
              />
              {errors.invoiceNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.invoiceNumber.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date
              </label>
              <Input
                type="date"
                {...register("invoiceDate")}
              />
              {errors.invoiceDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.invoiceDate.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date (Optional)
              </label>
              <Input
                type="date"
                {...register("dueDate")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer
              </label>
              <select
                {...register("customerId")}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.gstNumber ? `(${customer.gstNumber})` : ""}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.customerId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="Generated">Generated</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isSameState"
                {...register("isSameState")}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isSameState" className="text-sm font-medium text-gray-700">
                Customer is in same state (CGST + SGST)
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Invoice Items</h2>
            <Button
              type="button"
              onClick={() => append({ description: "", quantity: 1, rate: 0, gstRate: 18 })}
              variant="outline"
            >
              Add Item
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="mb-6 p-4 border border-gray-200 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">Item {index + 1}</h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => remove(index)}
                    variant="destructive"
                    size="sm"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    {...register(`items.${index}.description` as const)}
                    placeholder="Item description"
                  />
                  {errors.items?.[index]?.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.items[index]?.description?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    {...register(`items.${index}.quantity` as const, {
                      valueAsNumber: true,
                    })}
                    min="1"
                    step="1"
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.items[index]?.quantity?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate (₹)
                  </label>
                  <Input
                    type="number"
                    {...register(`items.${index}.rate` as const, {
                      valueAsNumber: true,
                    })}
                    min="0"
                    step="0.01"
                  />
                  {errors.items?.[index]?.rate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.items[index]?.rate?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    {...register(`items.${index}.gstRate` as const, {
                      valueAsNumber: true,
                    })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                  {errors.items?.[index]?.gstRate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.items[index]?.gstRate?.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-3 mt-2">
                  <p className="text-sm text-gray-600">
                    Amount: {formatCurrency((watchItems[index]?.quantity || 0) * (watchItems[index]?.rate || 0))}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {errors.items && errors.items.root && (
            <p className="mt-1 text-sm text-red-600">
              {errors.items.root.message}
            </p>
          )}

          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            {watchIsSameState ? (
              <>
                <div className="flex justify-between text-sm mb-2">
                  <span>CGST:</span>
                  <span>{formatCurrency(gstValues.cgst)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>SGST:</span>
                  <span>{formatCurrency(gstValues.sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-sm mb-2">
                <span>IGST:</span>
                <span>{formatCurrency(gstValues.igst)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            onClick={() => router.back()}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}