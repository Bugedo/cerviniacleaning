'use client';

import { useState, useEffect } from 'react';
import ResourceManager from '@/components/ResourceManager';

interface Job {
  id: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  type: string;
  cleaningType: string;
  propertyId: string;
  propertyName: string;
  client: string;
  resource1Id: string;
  resource1Name: string;
  resource2Id: string;
  resource2Name: string;
  resource3Id: string;
  resource3Name: string;
  resource4Id: string;
  resource4Name: string;
  resource5Id: string;
  resource5Name: string;
  resource6Id: string;
  resource6Name: string;
  resource7Id?: string;
  resource7Name?: string;
  resource8Id?: string;
  resource8Name?: string;
  resource9Id?: string;
  resource9Name?: string;
  resource10Id?: string;
  resource10Name?: string;
  resource11Id?: string;
  resource11Name?: string;
  coordinatorId: string;
  hoursWorked: string;
  status: string;
  notes: string;
}

interface Client {
  id: string;
  name: string;
  properties: Array<{ id: string; location: string }>;
}

export default function CalendarTab() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTime, setEditingTime] = useState<{ jobId: string; field: 'startTime' | 'endTime' } | null>(null);
  const [editingPropertyName, setEditingPropertyName] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingResources, setEditingResources] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const getWeekStart = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const getWeekDays = (weekStart: string): Date[] => {
    const start = new Date(weekStart);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getJobsForDay = (date: Date): Job[] => {
    const dateStr = date.toISOString().split('T')[0];
    return jobs.filter((job) => job.date === dateStr);
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    return time.length === 5 ? time : time.substring(0, 5);
  };

  const getDayName = (date: Date): string => {
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    return days[date.getDay()];
  };

  const getMonthName = (date: Date): string => {
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return months[date.getMonth()];
  };

  useEffect(() => {
    fetchJobs();
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Error al cargar clientes');
      const data = await response.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const weekStart = getWeekStart(currentWeek);
      const response = await fetch(`/api/calendar?weekStart=${weekStart}`);
      if (!response.ok) throw new Error('Error al cargar calendario');
      const data = await response.json();
      // Filtrar supervisiones - solo mostrar trabajos (Lavoro)
      const jobsOnly = (data.jobs || []).filter((job: Job) => job.type === 'Lavoro');
      setJobs(jobsOnly);
    } catch (error) {
      console.error('Error fetching calendar:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const changeWeek = (direction: number) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + direction * 7);
    setCurrentWeek(newWeek);
  };

  const handleTimeChange = (jobId: string, field: 'startTime' | 'endTime', value: string) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === jobId ? { ...job, [field]: value } : job
      )
    );
  };

  const handleDateChange = (jobId: string, value: string) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === jobId ? { ...job, date: value } : job
      )
    );
  };

  const handleDateBlur = async (jobId: string, value: string) => {
    setSaving((prev) => ({ ...prev, [`${jobId}-date`]: true }));
    
    try {
      const response = await fetch(`/api/calendar/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: value }),
      });

      if (!response.ok) throw new Error('Error al guardar');
      
      await fetchJobs(); // Recargar para obtener el día actualizado
    } catch (error) {
      console.error('Error saving date:', error);
    } finally {
      setSaving((prev) => ({ ...prev, [`${jobId}-date`]: false }));
      setEditingDate(null);
    }
  };

  const handleTimeBlur = async (jobId: string, field: 'startTime' | 'endTime', value: string) => {
    setSaving((prev) => ({ ...prev, [`${jobId}-${field}`]: true }));
    
    try {
      const response = await fetch(`/api/calendar/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) throw new Error('Error al guardar');
      
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId ? { ...job, [field]: value } : job
        )
      );
    } catch (error) {
      console.error('Error saving time:', error);
    } finally {
      setSaving((prev) => ({ ...prev, [`${jobId}-${field}`]: false }));
      setEditingTime(null);
    }
  };

  const handlePropertyNameBlur = async (jobId: string, value: string) => {
    setSaving((prev) => ({ ...prev, [`${jobId}-propertyName`]: true }));
    
    try {
      const response = await fetch(`/api/calendar/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyName: value }),
      });

      if (!response.ok) throw new Error('Error al guardar');
      
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId ? { ...job, propertyName: value } : job
        )
      );
    } catch (error) {
      console.error('Error saving property name:', error);
    } finally {
      setSaving((prev) => ({ ...prev, [`${jobId}-propertyName`]: false }));
      setEditingPropertyName(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo evento?')) return;

    try {
      const response = await fetch(`/api/calendar/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');
      
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Errore nell\'eliminazione dell\'evento');
    }
  };

  const handleCreateJob = async (formData: {
    date: string;
    startTime: string;
    endTime: string;
    clientId: string;
    propertyId: string;
    cleaningType: string;
  }) => {
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al crear evento');
      
      await fetchJobs();
      setShowCreateModal(false);
      setSelectedDate('');
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Errore nella creazione dell\'evento');
    }
  };

  const handleEditJob = async (jobId: string, formData: {
    date?: string;
    startTime?: string;
    endTime?: string;
    propertyId?: string;
    cleaningType?: string;
  }) => {
    try {
      const response = await fetch(`/api/calendar/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al actualizar');
      
      await fetchJobs();
      setEditingJob(null);
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Errore nell\'aggiornamento dell\'evento');
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Calendario</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  const weekDays = getWeekDays(getWeekStart(currentWeek));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Calendario</h2>
          <p className="text-sm text-gray-600 mt-1">
            {getMonthName(weekDays[0])} {weekDays[0].getFullYear()}
            {weekDays[0].getMonth() !== weekDays[6].getMonth() && (
              <> - {getMonthName(weekDays[6])} {weekDays[6].getFullYear()}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Nuovo Evento
          </button>
          <button
            onClick={() => changeWeek(-1)}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
          >
            Oggi
          </button>
          <button
            onClick={() => changeWeek(1)}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            →
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day, index) => (
            <div key={index} className="p-3 text-center border-r last:border-r-0 bg-gray-50">
              <div className="text-sm font-medium text-gray-600">{getDayName(day)}</div>
              <div className="text-lg font-semibold text-gray-900">{day.getDate()}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-[800px]">
          {weekDays.map((day, dayIndex) => {
            const dayJobs = getJobsForDay(day);
            const dayStr = day.toISOString().split('T')[0];
            return (
              <div key={dayIndex} className="p-2 border-r last:border-r-0 border-b min-h-[200px] relative">
                {dayJobs.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center mt-2">
                    Nessun lavoro
                    <button
                      onClick={() => {
                        setSelectedDate(dayStr);
                        setShowCreateModal(true);
                      }}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      + Aggiungi
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayJobs.map((job) => {
                      const isEditingStart = editingTime?.jobId === job.id && editingTime.field === 'startTime';
                      const isEditingEnd = editingTime?.jobId === job.id && editingTime.field === 'endTime';
                      const isEditingPropertyName = editingPropertyName === job.id;
                      const isEditingDate = editingDate === job.id;
                      const isSavingStart = saving[`${job.id}-startTime`];
                      const isSavingEnd = saving[`${job.id}-endTime`];
                      const isSavingPropertyName = saving[`${job.id}-propertyName`];
                      const isSavingDate = saving[`${job.id}-date`];

                      return (
                        <div
                          key={job.id}
                          className="p-2 rounded text-xs bg-green-100 border border-green-300"
                        >
                          {/* Botones de acción */}
                          <div className="flex justify-end gap-1 mb-1">
                            <button
                              onClick={() => setEditingJob(job)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                              title="Modifica"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                              title="Elimina"
                            >
                              🗑️
                            </button>
                          </div>

                          {/* Nombre de propiedad editable */}
                          <div className="font-semibold mb-1">
                            {isEditingPropertyName ? (
                              <input
                                type="text"
                                value={job.propertyName || ''}
                                onChange={(e) => {
                                  setJobs((prevJobs) =>
                                    prevJobs.map((j) =>
                                      j.id === job.id ? { ...j, propertyName: e.target.value } : j
                                    )
                                  );
                                }}
                                onBlur={(e) => handlePropertyNameBlur(job.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handlePropertyNameBlur(job.id, job.propertyName);
                                  }
                                }}
                                className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded font-semibold"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => setEditingPropertyName(job.id)}
                                className="cursor-pointer hover:bg-gray-200 px-1 rounded block"
                                title="Clicca per modificare"
                              >
                                {job.propertyName || 'Lavoro'}
                                {isSavingPropertyName && ' ...'}
                              </span>
                            )}
                          </div>

                          {/* Cliente */}
                          {job.client && (
                            <div className="text-xs text-gray-600 mb-1">
                              Cliente: {job.client}
                            </div>
                          )}

                          {/* Fecha editable */}
                          <div className="text-gray-600 mb-1">
                            <span className="text-xs font-medium">Data:</span>{' '}
                            {isEditingDate ? (
                              <input
                                type="date"
                                value={job.date}
                                onChange={(e) => handleDateChange(job.id, e.target.value)}
                                onBlur={(e) => handleDateBlur(job.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleDateBlur(job.id, job.date);
                                  }
                                }}
                                className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => setEditingDate(job.id)}
                                className="cursor-pointer hover:bg-gray-200 px-1 rounded"
                                title="Clicca per modificare"
                              >
                                {job.date}
                                {isSavingDate && ' ...'}
                              </span>
                            )}
                          </div>
                          
                          {job.cleaningType && (
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              {job.cleaningType === 'Profonda' ? '🧹 Profonda' : '✨ Repasso'}
                            </div>
                          )}

                          {/* Horario editable - siempre visible */}
                          <div className="text-gray-600 mb-2">
                            <span className="text-xs font-medium">Inizio:</span>{' '}
                            {isEditingStart ? (
                              <input
                                type="time"
                                value={formatTime(job.startTime)}
                                onChange={(e) => handleTimeChange(job.id, 'startTime', e.target.value)}
                                onBlur={(e) => handleTimeBlur(job.id, 'startTime', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleTimeBlur(job.id, 'startTime', job.startTime);
                                  }
                                }}
                                className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => setEditingTime({ jobId: job.id, field: 'startTime' })}
                                className="cursor-pointer hover:bg-gray-200 px-1 rounded"
                                title="Clicca per modificare"
                              >
                                {formatTime(job.startTime) || '--:--'}
                                {isSavingStart && ' ...'}
                              </span>
                            )}
                            {' | '}
                            <span className="text-xs font-medium">Fine:</span>{' '}
                            {isEditingEnd ? (
                              <input
                                type="time"
                                value={formatTime(job.endTime)}
                                onChange={(e) => handleTimeChange(job.id, 'endTime', e.target.value)}
                                onBlur={(e) => handleTimeBlur(job.id, 'endTime', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleTimeBlur(job.id, 'endTime', job.endTime);
                                  }
                                }}
                                className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => setEditingTime({ jobId: job.id, field: 'endTime' })}
                                className="cursor-pointer hover:bg-gray-200 px-1 rounded"
                                title="Clicca per modificare"
                              >
                                {formatTime(job.endTime) || '--:--'}
                                {isSavingEnd && ' ...'}
                              </span>
                            )}
                          </div>

                          {/* Empleados - dinámico */}
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <div className="text-xs font-medium text-gray-700 mb-1">Dipendenti:</div>
                            <ResourceManager job={job} onUpdate={fetchJobs} />
                            {job.hoursWorked && (
                              <div className="text-gray-600 mt-1 text-xs">
                                <span className="font-medium">Tempo:</span> {job.hoursWorked}h
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal para crear/editar evento */}
      {(showCreateModal || editingJob) && (
        <EventModal
          clients={clients}
          initialDate={selectedDate || editingJob?.date || ''}
          job={editingJob}
          onClose={() => {
            setShowCreateModal(false);
            setEditingJob(null);
            setSelectedDate('');
          }}
          onSubmit={editingJob 
            ? (data) => handleEditJob(editingJob.id, data)
            : handleCreateJob
          }
        />
      )}
    </div>
  );
}

// Componente Modal para crear/editar eventos
function EventModal({
  clients,
  initialDate,
  job,
  onClose,
  onSubmit,
}: {
  clients: Client[];
  initialDate: string;
  job: Job | null;
  onClose: () => void;
  onSubmit: (data: {
    date?: string;
    startTime?: string;
    endTime?: string;
    clientId?: string;
    propertyId?: string;
    cleaningType?: string;
  }) => void;
}) {
  const [formData, setFormData] = useState({
    date: initialDate || '',
    startTime: job?.startTime || '',
    endTime: job?.endTime || '',
    clientId: job?.client ? clients.find(c => c.name === job.client)?.id || '' : '',
    propertyId: job?.propertyId || '',
    cleaningType: job?.cleaningType || '',
  });

  const selectedClient = clients.find(c => c.id === formData.clientId);
  const availableProperties = selectedClient?.properties || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.clientId || !formData.propertyId) {
      alert('Per favore, compila tutti i campi obbligatori');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {job ? 'Modifica Evento' : 'Nuovo Evento'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ora Inizio
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ora Fine
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente *
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value, propertyId: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Seleziona cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proprietà *
            </label>
            <select
              value={formData.propertyId}
              onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
              disabled={!formData.clientId}
            >
              <option value="">Seleziona proprietà</option>
              {availableProperties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo di Pulizia
            </label>
            <select
              value={formData.cleaningType}
              onChange={(e) => setFormData({ ...formData, cleaningType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Nessuno</option>
              <option value="Profonda">Profonda</option>
              <option value="Repasso">Repasso</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {job ? 'Salva' : 'Crea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
