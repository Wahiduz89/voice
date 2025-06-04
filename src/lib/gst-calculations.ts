interface InvoiceItem {
  quantity: number;
  rate: number;
  gstRate: number;
}

export function calculateGST(subtotal: number, items: InvoiceItem[], isSameState: boolean) {
  // Calculate GST for each item based on its GST rate
  const gstAmounts = items.reduce(
    (acc, item) => {
      const itemAmount = (item.quantity || 0) * (item.rate || 0);
      const gstAmount = (itemAmount * (item.gstRate || 0)) / 100;
      
      if (isSameState) {
        // Split GST equally between CGST and SGST for same state
        acc.cgst += gstAmount / 2;
        acc.sgst += gstAmount / 2;
      } else {
        // Full GST goes to IGST for different state
        acc.igst += gstAmount;
      }
      
      return acc;
    },
    { cgst: 0, sgst: 0, igst: 0 }
  );
  
  return gstAmounts;
}

export function calculateTotal(subtotal: number, cgst: number, sgst: number, igst: number) {
  return subtotal + cgst + sgst + igst;
}

export function formatCurrency(amount: number) {
  // Format as Indian currency (₹)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function numberToWords(num: number) {
  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const formatTens = (num: number) => {
    if (num < 10) return single[num];
    if (num < 20) return double[num - 10];
    return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + single[num % 10] : '');
  };
  
  // Handle rupees and paise separately
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  // Convert rupees to words using Indian number system (lakhs, crores)
  if (rupees === 0) return paise > 0 ? `Zero Rupees and ${formatTens(paise)} Paise Only` : 'Zero Rupees Only';
  
  let words = '';
  
  // Handle crores (10 million)
  if (rupees >= 10000000) {
    words += formatTens(Math.floor(rupees / 10000000)) + ' Crore ';
    rupees %= 10000000;
  }
  
  // Handle lakhs (100 thousand)
  if (rupees >= 100000) {
    words += formatTens(Math.floor(rupees / 100000)) + ' Lakh ';
    rupees %= 100000;
  }
  
  // Handle thousands
  if (rupees >= 1000) {
    words += formatTens(Math.floor(rupees / 1000)) + ' Thousand ';
    rupees %= 1000;
  }
  
  // Handle hundreds
  if (rupees >= 100) {
    words += formatTens(Math.floor(rupees / 100)) + ' Hundred ';
    rupees %= 100;
  }
  
  // Handle remaining tens and units
  if (rupees > 0) {
    words += formatTens(rupees);
  }
  
  words += ' Rupees';
  
  // Add paise if present
  if (paise > 0) {
    words += ' and ' + formatTens(paise) + ' Paise';
  }
  
  return words + ' Only';
}