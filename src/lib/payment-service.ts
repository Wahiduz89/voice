import { db } from "./db";
import { razorpayConfig, phonepeConfig, paytmConfig, googlePayConfig, DEFAULT_PAYMENT_GATEWAY, SUPPORTED_UPI_METHODS } from "./payment-config";
import QRCode from "qrcode";
import { PaymentStatus } from "@prisma/client";

// You'll need to install these packages:
// npm install razorpay qrcode axios paytmchecksum

export async function generatePaymentLink(invoiceId: string, amount: number, gateway = DEFAULT_PAYMENT_GATEWAY) {
  try {
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, user: true }
    });

    if (!invoice) throw new Error("Invoice not found");

    // Implementation will depend on which gateway you choose
    if (gateway === "razorpay") {
      return await generateRazorpayLink(invoice, amount);
    } else if (gateway === "phonepe") {
      return await generatePhonePeLink(invoice, amount);
    } else if (gateway === "paytm") {
      return await generatePaytmLink(invoice, amount);
    } else if (gateway === "googlepay") {
      return await generateGooglePayLink(invoice, amount);
    }
    
    throw new Error("Unsupported payment gateway");
  } catch (error) {
    console.error("Error generating payment link:", error);
    throw error;
  }
}

async function generateRazorpayLink(invoice: any, amount: number) {
  // This is a placeholder - you'll need to implement the actual Razorpay API call
  // using their SDK or REST API
  
  // Example implementation outline:
  // 1. Create a Razorpay order
  // 2. Generate a payment link for that order
  // 3. Store the payment details in your database
  // 4. Return the payment link and other details
  
  const paymentLink = `https://rzp.io/i/example-${invoice.id}`; // This would be returned from Razorpay
  const qrCodeUrl = await generateQRCode(paymentLink);
  
  // Create payment record
  const payment = await db.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: amount,
      status: "PENDING",
      paymentLink: paymentLink,
      qrCodeUrl: qrCodeUrl,
      paymentMethod: "UPI"
    }
  });
  
  return {
    paymentId: payment.id,
    paymentLink,
    qrCodeUrl
  };
}

async function generatePhonePeLink(invoice: any, amount: number) {
  // Similar implementation for PhonePe
  // This is just a placeholder
  
  const paymentLink = `https://phonepe.io/pay/${invoice.id}`; // This would be returned from PhonePe
  const qrCodeUrl = await generateQRCode(paymentLink);
  
  const payment = await db.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: amount,
      status: "PENDING",
      paymentLink: paymentLink,
      qrCodeUrl: qrCodeUrl,
      paymentMethod: "UPI"
    }
  });
  
  return {
    paymentId: payment.id,
    paymentLink,
    qrCodeUrl
  };
}

async function generatePaytmLink(invoice: any, amount: number) {
  // This is a placeholder - you'll need to implement the actual Paytm API call
  // using their SDK or REST API
  
  // Example implementation outline:
  // 1. Create a Paytm order
  // 2. Generate a payment link for that order
  // 3. Store the payment details in your database
  
  const paymentLink = `https://paytm.com/link/${invoice.id}`; // This would be returned from Paytm
  const qrCodeUrl = await generateQRCode(paymentLink);
  
  const payment = await db.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: amount,
      status: "PENDING",
      paymentLink: paymentLink,
      qrCodeUrl: qrCodeUrl,
      paymentMethod: "UPI-Paytm"
    }
  });
  
  return {
    paymentId: payment.id,
    paymentLink,
    qrCodeUrl
  };
}

async function generateGooglePayLink(invoice: any, amount: number) {
  // This is a placeholder - you'll need to implement the actual Google Pay API call
  
  // For Google Pay, you might generate a UPI deep link or intent URL
  // Example: upi://pay?pa=merchant@upi&pn=Merchant%20Name&am=100.00&cu=INR&tn=Invoice%20Payment
  
  const upiId = invoice.user.businessEmail || "default@upi"; // Use business UPI ID
  const merchantName = encodeURIComponent(invoice.user.businessName || "Business");
  const description = encodeURIComponent(`Payment for Invoice #${invoice.invoiceNumber}`);
  
  const paymentLink = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=${description}`;
  const qrCodeUrl = await generateQRCode(paymentLink);
  
  const payment = await db.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: amount,
      status: "PENDING",
      paymentLink: paymentLink,
      qrCodeUrl: qrCodeUrl,
      paymentMethod: "UPI-GooglePay"
    }
  });
  
  return {
    paymentId: payment.id,
    paymentLink,
    qrCodeUrl
  };
}

async function generateQRCode(text: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

export async function updatePaymentStatus(paymentId: string, status: PaymentStatus, transactionId?: string) {
  try {
    const payment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status,
        transactionId,
        paymentDate: status === "PAID" ? new Date() : undefined
      },
      include: { invoice: true }
    });
    
    // Update invoice payment status
    await updateInvoicePaymentStatus(payment.invoiceId);
    
    return payment;
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
}

async function updateInvoicePaymentStatus(invoiceId: string) {
  // Get all payments for this invoice
  const payments = await db.payment.findMany({
    where: { invoiceId }
  });
  
  // Calculate total paid amount
  const totalPaid = payments
    .filter(p => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  // Get invoice total
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId }
  });
  
  if (!invoice) return;
  
  let newStatus: PaymentStatus = "PENDING";
  
  if (totalPaid >= Number(invoice.total)) {
    newStatus = "PAID";
  } else if (totalPaid > 0) {
    newStatus = "PARTIAL";
  } else if (payments.some(p => p.status === "FAILED")) {
    newStatus = "FAILED";
  }
  
  // Update invoice status
  await db.invoice.update({
    where: { id: invoiceId },
    data: { paymentStatus: newStatus }
  });
}

export async function sendPaymentReminder(invoiceId: string) {
  // This would integrate with your email/SMS service
  // For now, just mark the reminder as sent
  
  const payments = await db.payment.findMany({
    where: { invoiceId, status: "PENDING" }
  });
  
  if (payments.length === 0) return false;
  
  // Update all pending payments for this invoice
  await Promise.all(payments.map(payment => 
    db.payment.update({
      where: { id: payment.id },
      data: {
        reminderSent: true,
        reminderDate: new Date()
      }
    })
  ));
  
  // In a real implementation, you would send an email or SMS here
  
  return true;
}