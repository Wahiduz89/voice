import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Schema for invoice validation
const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0, "Rate must be a positive number"),
  gstRate: z.number().min(0, "GST rate must be a positive number"),
  amount: z.number().min(0, "Amount must be a positive number"),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  isSameState: z.boolean(),
  status: z.string(),
  subtotal: z.number().min(0, "Subtotal must be a positive number"),
  cgst: z.number().min(0, "CGST must be a positive number"),
  sgst: z.number().min(0, "SGST must be a positive number"),
  igst: z.number().min(0, "IGST must be a positive number"),
  total: z.number().min(0, "Total must be a positive number"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const invoiceId = params.id;

    const invoice = await db.invoice.findUnique({
      where: {
        id: invoiceId,
        userId,
      },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const invoiceId = params.id;
    const body = await req.json();

    // Validate the request body
    const validationResult = invoiceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Check if the invoice exists and belongs to the user
    const existingInvoice = await db.invoice.findUnique({
      where: {
        id: invoiceId,
        userId,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { items, ...invoiceData } = validationResult.data;

    // Update the invoice
    const updatedInvoice = await db.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        ...invoiceData,
        invoiceDate: new Date(invoiceData.invoiceDate),
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
        // Delete existing items and create new ones
        items: {
          deleteMany: {},
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            gstRate: item.gstRate,
            amount: item.amount,
          })),
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}