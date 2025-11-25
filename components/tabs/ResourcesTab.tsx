'use client';

import { useState, useEffect } from 'react';

interface Resource {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  role: string;
  active: string;
  totalHours: string;
  jobsCount: number;
}

export default function ResourcesTab() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const url = selectedMonth
        ? `/api/resources?month=${selectedMonth}`
        : '/api/resources';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar recursos');
      const data = await response.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentMonth = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatMonth = (month: string): string => {
    if (!month) return 'Tutti i mesi';
    const [year, monthNum] = month.split('-');
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return `${months[parseInt(monthNum) - 1]} ${year}`;
  };

  const formatHours = (hours: string): string => {
    const hoursNum = parseFloat(hours || '0');
    if (isNaN(hoursNum) || hoursNum === 0) return '0h';
    
    const wholeHours = Math.floor(hoursNum);
    const minutes = Math.round((hoursNum - wholeHours) * 60);
    
    if (minutes === 0) {
      return `${wholeHours}h`;
    } else if (minutes === 30) {
      return `${wholeHours}h e mezza`;
    } else {
      return `${wholeHours}h ${minutes}min`;
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Risorse</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Risorse</h2>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tutti i mesi</option>
            <option value={getCurrentMonth()}>Mese corrente</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ruolo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lavori
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ore Totali
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {resources.map((resource) => (
              <tr key={resource.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {resource.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {resource.name} {resource.surname}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {resource.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {resource.jobsCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {formatHours(resource.totalHours)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      resource.active === 'Sì'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {resource.active === 'Sì' ? 'Attivo' : 'Inattivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedMonth && (
        <div className="mt-4 text-sm text-gray-600">
          Mostrando dati per: <strong>{formatMonth(selectedMonth)}</strong>
        </div>
      )}
    </div>
  );
}
