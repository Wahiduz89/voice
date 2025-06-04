import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPaymentReminder } from "@/lib/payment-service";

// Schema for reminder request
const reminderSchema = z.object({
  invoiceId: z.string()
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
    const validationResult = reminderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { invoiceId } = validationResult.data;

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

    // Send reminder
    const reminderSent = await sendPaymentReminder(invoiceId);

    return NextResponse.json({ success: reminderSent });
  } catch (error) {
    console.error("Error sending payment reminder:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}