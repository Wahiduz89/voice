import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePaymentLink } from "@/lib/payment-service";

// Schema for payment creation
const paymentCreateSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().positive("Amount must be positive")
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    // Validate request body
    const validationResult = paymentCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { invoiceId, amount } = validationResult.data;

    // Verify invoice belongs to user
    const invoice = await db.invoice.findUnique({
      where: {
        id: invoiceId,
        userId
      }
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Generate payment link
    const paymentData = await generatePaymentLink(invoiceId, amount);

    return NextResponse.json(paymentData);
  } catch (error) {
    console.error("Error creating payment:", error);
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
    const invoiceId = url.searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    // Verify invoice belongs to user
    const invoice = await db.invoice.findUnique({
      where: {
        id: invoiceId,
        userId
      },
      include: {
        payments: true
      }
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ payments: invoice.payments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}