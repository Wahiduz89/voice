import Link from "next/link";
import { Button } from "@/components/ui/button";

const pricingPlans = [
  {
    name: "Free",
    price: "₹0",
    description: "Perfect for small businesses just getting started",
    features: [
      "5 invoices per month",
      "Basic invoice templates",
      "GST calculation",
      "PDF download",
      "Email support",
    ],
    limitations: [
      "No custom branding",
      "Limited payment options",
      "No recurring invoices",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Standard",
    price: "₹999",
    period: "per month",
    description: "Ideal for growing businesses with regular invoicing needs",
    features: [
      "100 invoices per month",
      "Multiple invoice templates",
      "GST calculation",
      "PDF download",
      "Custom branding",
      "All payment options",
      "Email & phone support",
      "Basic analytics",
    ],
    limitations: [
      "Limited recurring invoices",
      "Basic inventory management",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Premium",
    price: "₹1,999",
    period: "per month",
    description: "For established businesses with advanced requirements",
    features: [
      "Unlimited invoices",
      "All invoice templates",
      "GST calculation",
      "PDF download",
      "Custom branding",
      "All payment options",
      "Priority support",
      "Advanced analytics",
      "Recurring invoices",
      "Full inventory management",
      "Multi-user access",
      "API access",
    ],
    limitations: [],
    cta: "Start Free Trial",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">
            Choose the plan that works best for your business needs. All plans include our core GST invoice generation features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => (
            <div 
              key={plan.name} 
              className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${plan.popular ? 'ring-2 ring-indigo-600 scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="bg-indigo-600 text-white text-center py-2 font-medium">
                  Most Popular
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-600 ml-2">{plan.period}</span>}
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <Link href="/auth/register">
                  <Button 
                    className={`w-full py-2 px-4 rounded-md font-medium ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
              
              <div className="px-8 pb-8">
                <h4 className="font-semibold text-gray-900 mb-4">Features included:</h4>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                  
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start">
                      <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-gray-500">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need a custom plan?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            We offer custom solutions for businesses with specific requirements. Contact our sales team to discuss your needs.
          </p>
          <Link href="/contact">
            <Button variant="outline" className="mx-auto">
              Contact Sales
            </Button>
          </Link>
        </div>
        
        <div className="mt-16 bg-gray-50 rounded-xl p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Can I upgrade or downgrade my plan?</h3>
              <p className="text-gray-600">Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated difference for the remainder of your billing cycle. When downgrading, the new rate will apply at the start of your next billing cycle.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Is there a contract or commitment?</h3>
              <p className="text-gray-600">No, all our plans are month-to-month with no long-term contracts. You can cancel anytime.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Do you offer discounts for annual billing?</h3>
              <p className="text-gray-600">Yes, you can save 20% by choosing annual billing on any of our paid plans.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards, UPI payments, and bank transfers for annual plans.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}