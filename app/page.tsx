'use client';

import { useState } from 'react';
import ClientsTab from '@/components/tabs/ClientsTab';
import CalendarTab from '@/components/tabs/CalendarTab';
import ResourcesTab from '@/components/tabs/ResourcesTab';
import BillingTab from '@/components/tabs/BillingTab';

type Tab = 'clients' | 'calendar' | 'resources' | 'billing';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('clients');

  const tabs = [
    { id: 'clients' as Tab, label: 'Clienti' },
    { id: 'calendar' as Tab, label: 'Calendario' },
    { id: 'resources' as Tab, label: 'Risorse' },
    { id: 'billing' as Tab, label: 'Fatturazione' },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Cervinia Cleaning</h1>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'clients' && <ClientsTab />}
        {activeTab === 'calendar' && <CalendarTab />}
        {activeTab === 'resources' && <ResourcesTab />}
        {activeTab === 'billing' && <BillingTab />}
      </div>
    </main>
  );
}
