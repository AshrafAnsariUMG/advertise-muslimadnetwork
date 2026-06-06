'use client';

import React from 'react';
import PublicShell from '@/components/layout/PublicShell';
import { Mail, Phone, Globe, Calendar } from 'lucide-react';

export default function Contact() {
  return (
    <PublicShell>
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black text-gray-900 mb-4">Contact Muslim Ad Network</h1>
        <p className="text-lg text-gray-600 mb-12">
          Ready to reach Muslim consumers at scale? Get in touch with our team and we'll help you build
          the right campaign strategy.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <a
            href="mailto:sales@muslimadnetwork.com"
            className="flex items-start gap-4 bg-gray-50 border border-gray-200 rounded-xl p-6 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
          >
            <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
              <Mail className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Email Us</p>
              <p className="text-indigo-600 font-medium">sales@muslimadnetwork.com</p>
              <p className="text-sm text-gray-500 mt-1">We respond within 1 business day</p>
            </div>
          </a>

          <a
            href="https://muslimadnetwork.pipedrive.com/scheduler/9KmA9sa/muslim-ad-network-advertising-partnership-next-steps"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 bg-gray-50 border border-gray-200 rounded-xl p-6 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
          >
            <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Schedule a Meeting</p>
              <p className="text-indigo-600 font-medium">Book a strategy call</p>
              <p className="text-sm text-gray-500 mt-1">30-minute campaign consultation</p>
            </div>
          </a>

          <a
            href="https://muslimadnetwork.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 bg-gray-50 border border-gray-200 rounded-xl p-6 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
          >
            <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
              <Globe className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Website</p>
              <p className="text-indigo-600 font-medium">muslimadnetwork.com</p>
              <p className="text-sm text-gray-500 mt-1">Learn more about our platform</p>
            </div>
          </a>

          <div className="flex items-start gap-4 bg-gray-50 border border-gray-200 rounded-xl p-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">WhatsApp</p>
              <a
                href="https://wa.me/8801619130578"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 font-medium hover:underline"
              >
                Chat on WhatsApp
              </a>
              <p className="text-sm text-gray-500 mt-1">Quick responses during business hours</p>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
          <p className="text-gray-700 font-medium mb-4">Ready to launch your campaign?</p>
          <a
            href="/"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition-colors"
          >
            Start Your Campaign →
          </a>
        </div>
      </div>
    </div>
    </PublicShell>
  );
}
