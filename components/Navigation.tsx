'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Tab = 'clients' | 'calendar' | 'resources' | 'billing';

const tabs = [
  { id: 'clients' as Tab, label: 'Clienti', path: '/clients' },
  { id: 'calendar' as Tab, label: 'Calendario', path: '/calendar' },
  { id: 'resources' as Tab, label: 'Risorse', path: '/resources' },
  { id: 'billing' as Tab, label: 'Fatturazione', path: '/billing' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path || (pathname === '/' && tab.id === 'clients');
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

