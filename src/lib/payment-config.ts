import { PaymentStatus } from "@prisma/client";

export interface PaymentGatewayConfig {
  apiKey: string;
  apiSecret: string;
  environment: "test" | "production";
}

export const razorpayConfig: PaymentGatewayConfig = {
  apiKey: process.env.RAZORPAY_API_KEY || "",
  apiSecret: process.env.RAZORPAY_API_SECRET || "",
  environment: (process.env.PAYMENT_ENVIRONMENT as "test" | "production") || "test",
};

export const phonepeConfig: PaymentGatewayConfig = {
  apiKey: process.env.PHONEPE_API_KEY || "",
  apiSecret: process.env.PHONEPE_API_SECRET || "",
  environment: (process.env.PAYMENT_ENVIRONMENT as "test" | "production") || "test",
};

export const paytmConfig: PaymentGatewayConfig = {
  apiKey: process.env.PAYTM_API_KEY || "",
  apiSecret: process.env.PAYTM_API_SECRET || "",
  environment: (process.env.PAYMENT_ENVIRONMENT as "test" | "production") || "test",
};

export const googlePayConfig: PaymentGatewayConfig = {
  apiKey: process.env.GOOGLEPAY_API_KEY || "",
  apiSecret: process.env.GOOGLEPAY_API_SECRET || "",
  environment: (process.env.PAYMENT_ENVIRONMENT as "test" | "production") || "test",
};

// List of supported payment methods
export const SUPPORTED_UPI_METHODS = ["razorpay", "phonepe", "paytm", "googlepay"];

export const DEFAULT_PAYMENT_GATEWAY = process.env.DEFAULT_PAYMENT_GATEWAY || "razorpay";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PARTIAL: "Partially Paid",
  PAID: "Paid",
  FAILED: "Failed"
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: "text-yellow-600 bg-yellow-100",
  PARTIAL: "text-blue-600 bg-blue-100",
  PAID: "text-green-600 bg-green-100",
  FAILED: "text-red-600 bg-red-100"
};