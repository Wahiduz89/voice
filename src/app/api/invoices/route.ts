import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Schema for invoice validation
const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0, "Rate must be a positive number"),
  gstRate: z.number().min(0, "GST rate must be a positive number"),
  amount: z.number().min(0, "Amount must be a positive number"),
});

// Update the invoice schema to include the new fields
const invoiceSchema = z.object({
  invoiceNumber: z.string(),
  invoiceDate: z.string(),
  dueDate: z.string().optional(),
  customerId: z.string(),
  isSameState: z.boolean().default(true),
  subtotal: z.number(),
  cgst: z.number(),
  sgst: z.number(),
  igst: z.number(),
  total: z.number(),
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      rate: z.number(),
      gstRate: z.number(),
      amount: z.number(),
    })
  ),
  // New fields
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  paymentInstructions: z.string().optional(),
  currency: z.string().default("INR"),
  discount: z.number().default(0),
  discountType: z.string().default("fixed"),
  shippingCharges: z.number().default(0),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    // Validate the request body
    const validationResult = invoiceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { items, ...invoiceData } = validationResult.data;

    // Create the invoice with items
    // Create the invoice with the new fields
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: "Generated",
        subtotal: data.subtotal,
        cgst: data.cgst,
        sgst: data.sgst,
        igst: data.igst,
        total: data.total,
        isSameState: data.isSameState,
        userId: userId,
        customerId: data.customerId,
        // New fields
        notes: data.notes,
        termsAndConditions: data.termsAndConditions,
        paymentInstructions: data.paymentInstructions,
        currency: data.currency,
        discount: data.discount,
        discountType: data.discountType,
        shippingCharges: data.shippingCharges,
        items: {
          create: data.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            gstRate: item.gstRate,
            amount: item.amount,
          })),
        },
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    
    const invoices = await db.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        customer: true,
      },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}