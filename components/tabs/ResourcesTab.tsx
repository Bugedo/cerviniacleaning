'use client';

import React, { useState, useEffect } from 'react';
import ManualHoursModal from '@/components/ManualHoursModal';

interface Job {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  propertyName: string;
  client: string;
}

interface ManualHour {
  id: string;
  resourceId: string;
  date: string;
  hours: number;
  notes: string;
}

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
  jobs: Job[];
  weeklyHours: Record<string, number>;
  monthlyHours: Record<string, number>;
  manualHours?: ManualHour[];
  isCoordinatorOnly?: boolean;
}

export default function ResourcesTab() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [expandedResource, setExpandedResource] = useState<string | null>(null);
  const [showManualHoursModal, setShowManualHoursModal] = useState(false);
  const [selectedResourceForManualHours, setSelectedResourceForManualHours] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const fetchResources = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const url = selectedMonth
        ? `/api/resources?month=${selectedMonth}`
        : '/api/resources';
      
      // Si se fuerza refresh, agregar timestamp para evitar caché
      const fetchUrl = forceRefresh ? `${url}?_t=${Date.now()}` : url;
      
      const response = await fetch(fetchUrl);
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

  const formatHours = (hours: string | number): string => {
    const hoursNum = typeof hours === 'string' ? parseFloat(hours || '0') : hours;
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

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatWeek = (weekStart: string): string => {
    const date = new Date(weekStart);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 6);
    return `${formatDate(weekStart)} - ${formatDate(endDate.toISOString().split('T')[0])}`;
  };

  const formatMonthLabel = (monthStr: string): string => {
    const [year, month] = monthStr.split('-');
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
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
          <button
            onClick={() => fetchResources(true)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Ricarica dati"
          >
            🔄 Aggiorna
          </button>
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
                Ore Totali
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {resources.map((resource) => {
              const isExpanded = expandedResource === resource.id;
              return (
                <React.Fragment key={resource.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {resource.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {resource.name} {resource.surname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {resource.role}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setExpandedResource(isExpanded ? null : resource.id)}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {isExpanded ? 'Nascondi' : 'Dettagli'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedResourceForManualHours({
                              id: resource.id,
                              name: `${resource.name} ${resource.surname}`,
                            });
                            setShowManualHoursModal(true);
                          }}
                          className="text-green-600 hover:text-green-800 underline"
                          title="Aggiungi ore manuali"
                        >
                          + Ore Manuali
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          {/* Horas Manuales - Mostrar primero para coordinadores */}
                          {resource.isCoordinatorOnly && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                Ore Manuali ({resource.manualHours?.length || 0})
                              </h4>
                              {resource.manualHours && resource.manualHours.length > 0 ? (
                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Data</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Ore</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Dettaglio</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {resource.manualHours
                                        .sort((a, b) => b.date.localeCompare(a.date))
                                        .map((mh) => (
                                          <tr key={mh.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-xs text-gray-900">
                                              {formatDate(mh.date)}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-900 font-semibold">
                                              {formatHours(mh.hours)}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-500">
                                              {mh.notes || '-'}
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Nessuna ora manuale registrata</p>
                              )}
                            </div>
                          )}

                          {/* Eventos - Solo para no coordinadores */}
                          {!resource.isCoordinatorOnly && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                Eventi ({resource.jobs.length})
                              </h4>
                              {resource.jobs.length > 0 ? (
                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Data</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Ora</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Proprietà</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Cliente</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {resource.jobs.map((job) => (
                                        <tr key={job.id} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 text-xs text-gray-900">
                                            {formatDate(job.date)}
                                          </td>
                                          <td className="px-3 py-2 text-xs text-gray-500">
                                            {job.startTime} - {job.endTime}
                                          </td>
                                          <td className="px-3 py-2 text-xs text-gray-500">
                                            {job.propertyName}
                                          </td>
                                          <td className="px-3 py-2 text-xs text-gray-500">
                                            {job.client}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Nessun evento</p>
                              )}
                            </div>
                          )}

                          {/* Horas Manuales - Para empleados normales (además de eventos) */}
                          {!resource.isCoordinatorOnly && resource.manualHours && resource.manualHours.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                Ore Manuali Aggiuntive ({resource.manualHours.length})
                              </h4>
                              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Data</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Ore</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Dettaglio</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {resource.manualHours
                                      .sort((a, b) => b.date.localeCompare(a.date))
                                      .map((mh) => (
                                        <tr key={mh.id} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 text-xs text-gray-900">
                                            {formatDate(mh.date)}
                                          </td>
                                          <td className="px-3 py-2 text-xs text-gray-900 font-semibold">
                                            {formatHours(mh.hours)}
                                          </td>
                                          <td className="px-3 py-2 text-xs text-gray-500">
                                            {mh.notes || '-'}
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Ore per settimana */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">
                              Ore per Settimana
                            </h4>
                            {Object.keys(resource.weeklyHours).length > 0 ? (
                              <div className="space-y-1">
                                {Object.entries(resource.weeklyHours)
                                  .sort(([a], [b]) => a.localeCompare(b))
                                  .map(([weekStart, hours]) => (
                                    <div key={weekStart} className="flex justify-between text-sm text-gray-700 bg-white px-3 py-1 rounded border border-gray-200">
                                      <span>{formatWeek(weekStart)}</span>
                                      <span className="font-semibold">{formatHours(hours)}</span>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">Nessuna ora registrata</p>
                            )}
                          </div>

                          {/* Ore per mese */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">
                              Ore per Mese
                            </h4>
                            {Object.keys(resource.monthlyHours).length > 0 ? (
                              <div className="space-y-1">
                                {Object.entries(resource.monthlyHours)
                                  .sort(([a], [b]) => a.localeCompare(b))
                                  .map(([month, hours]) => (
                                    <div key={month} className="flex justify-between text-sm text-gray-700 bg-white px-3 py-1 rounded border border-gray-200">
                                      <span>{formatMonthLabel(month)}</span>
                                      <span className="font-semibold">{formatHours(hours)}</span>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">Nessuna ora registrata</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedMonth && (
        <div className="mt-4 text-sm text-gray-600">
          Mostrando dati per: <strong>{formatMonth(selectedMonth)}</strong>
        </div>
      )}

      {showManualHoursModal && selectedResourceForManualHours && (
        <ManualHoursModal
          resourceId={selectedResourceForManualHours.id}
          resourceName={selectedResourceForManualHours.name}
          onClose={() => {
            setShowManualHoursModal(false);
            setSelectedResourceForManualHours(null);
          }}
          onSave={() => {
            fetchResources();
          }}
        />
      )}
    </div>
  );
}
