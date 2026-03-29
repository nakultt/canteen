"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface FAQItem {
  question: string;
  answer: string;
}

export default function Help() {
  const { user } = useAuth();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs: FAQItem[] = [
    {
      question: "How do I place an order?",
      answer:
        "Browse the current menu on the home page, click 'Add to Cart' for items you want, then go to your cart to place the order. Make sure to order within the meal timing windows.",
    },
    {
      question: "What are the meal timings?",
      answer:
        "Breakfast: 7:00 AM - 10:00 AM, Lunch: 12:00 PM - 3:00 PM, Snacks: 4:00 PM - 6:00 PM, Dinner: 7:00 PM - 10:00 PM. Orders close at the end of each meal period.",
    },
    {
      question: "Can I modify or cancel my order?",
      answer:
        "Once an order is placed, it cannot be modified or cancelled through the app. Please contact the canteen staff immediately if you need to make changes.",
    },
    {
      question: "How do I check my order history?",
      answer:
        "Click on 'My Orders' in the navigation menu to view all your past orders, including order details, items, and status.",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "Currently, we accept cash payments at the canteen counter. Digital payment options will be available soon.",
    },
    {
      question: "How long does it take to prepare an order?",
      answer:
        "Order preparation time varies based on the items and current queue. Typically, orders are ready within 15-30 minutes during peak hours.",
    },
  ];

  return (
    <div>
      <Navbar username={user?.name} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Help & Support</h1>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-emerald-50 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">?</span>
            </div>
            <h3 className="font-semibold mb-2">FAQ</h3>
            <p className="text-gray-600 text-sm">
              Find answers to common questions
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">📞</span>
            </div>
            <h3 className="font-semibold mb-2">Contact Support</h3>
            <p className="text-gray-600 text-sm">Get help from our team</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">💡</span>
            </div>
            <h3 className="font-semibold mb-2">Suggestions</h3>
            <p className="text-gray-600 text-sm">Share your feedback with us</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{faq.question}</span>
                    <span className="text-gray-500">
                      {openFAQ === index ? "−" : "+"}
                    </span>
                  </div>
                </button>
                {openFAQ === index && (
                  <div className="px-6 py-4 bg-white border-t border-gray-200">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Canteen Office</h3>
              <div className="space-y-3 text-gray-700">
                <p className="flex items-center">
                  <span className="font-medium w-20">Phone:</span>
                  <span>+91 98765 43210</span>
                </p>
                <p className="flex items-center">
                  <span className="font-medium w-20">Email:</span>
                  <span>canteen@company.com</span>
                </p>
                <p className="flex items-center">
                  <span className="font-medium w-20">Location:</span>
                  <span>Ground Floor, Main Building</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Technical Support</h3>
              <div className="space-y-3 text-gray-700">
                <p className="flex items-center">
                  <span className="font-medium w-20">Email:</span>
                  <span>techsupport@company.com</span>
                </p>
                <p className="flex items-center">
                  <span className="font-medium w-20">Response:</span>
                  <span>Within 24 hours</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
