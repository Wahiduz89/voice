"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PaymentStatus } from "@prisma/client";

interface PaymentButtonProps {
  invoiceId: string;
  total: number;
  status: PaymentStatus;
}

export default function PaymentButton({ invoiceId, total, status }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState("");

  const handleGeneratePayment = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, amount: total }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate payment link");
      }

      setPaymentData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send payment reminder");
      }

      alert("Payment reminder sent successfully");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {paymentData ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Payment Information</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Scan QR code to pay:</p>
            <img 
              src={paymentData.qrCodeUrl} 
              alt="Payment QR Code" 
              className="w-48 h-48 mx-auto"
            />
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Or use payment link:</p>
            <a 
              href={paymentData.paymentLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {paymentData.paymentLink}
            </a>
          </div>
          
          <Button
            onClick={() => setPaymentData(null)}
            variant="outline"
            className="w-full"
          >
            Generate New Payment Link
          </Button>
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          <Button
            onClick={handleGeneratePayment}
            disabled={isLoading || status === "PAID"}
            className="w-full"
          >
            {isLoading ? "Generating..." : "Generate Payment Link"}
          </Button>
          
          {status === "PENDING" && (
            <Button
              onClick={handleSendReminder}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? "Sending..." : "Send Payment Reminder"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}