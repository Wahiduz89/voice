import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="py-12 md:py-24 lg:py-32 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Simple GST Invoicing for Indian Businesses
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl">
            Create professional GST invoices, track payments, and manage your business finances with ease.
          </p>
          <div className="flex gap-4 flex-col sm:flex-row justify-center">
            <Link 
              href="/auth/register" 
              className="rounded-full bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Get Started Free
            </Link>
            <Link 
              href="/pricing" 
              className="rounded-full border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-3">GST Compliant</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Automatically calculate CGST, SGST, and IGST based on your customer's location.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Easy to Use</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create and send professional invoices in minutes with our intuitive interface.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Secure</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your data is encrypted and securely stored. Access it from anywhere, anytime.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
