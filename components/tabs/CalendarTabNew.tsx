'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/apiClient';
import { CACHE_KEYS, localCache } from '@/lib/localCache';

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
  clientId: string;
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

interface Resource {
  id: string;
  name: string;
  surname: string;
  role: string;
}

// Generar color consistente para cada cliente
const getClientColor = (clientId: string, clients: Client[]): string => {
  const clientIndex = clients.findIndex(c => c.id === clientId);
  if (clientIndex === -1) return 'bg-green-100 border-green-300';
  
  const colors = [
    'bg-blue-100 border-blue-300',
    'bg-purple-100 border-purple-300',
    'bg-pink-100 border-pink-300',
    'bg-yellow-100 border-yellow-300',
    'bg-indigo-100 border-indigo-300',
    'bg-red-100 border-red-300',
    'bg-teal-100 border-teal-300',
    'bg-orange-100 border-orange-300',
    'bg-cyan-100 border-cyan-300',
    'bg-lime-100 border-lime-300',
  ];
  
  return colors[clientIndex % colors.length] || 'bg-green-100 border-green-300';
};

export default function CalendarTabNew() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
    if (!time) return '--:--';
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
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek]);

  const fetchClients = async () => {
    try {
      const data = await apiGet<{ clients: Client[] }>('/api/clients', CACHE_KEYS.CLIENTS);
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  const fetchResources = async () => {
    try {
      const data = await apiGet<{ resources: Resource[] }>('/api/resources', CACHE_KEYS.RESOURCES);
      // Filtrar solo empleados que NO son coordinadores ni asistentes coordinadores
      const employees = (data.resources || []).filter(
        (resource: Resource) => {
          const role = (resource.role || '').toLowerCase();
          return !role.includes('coordinatore') && 
                 !role.includes('coordinador') &&
                 !role.includes('assistente coordinatore') &&
                 !role.includes('asistente coordinador');
        }
      );
      setResources(employees);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources([]);
    }
  };

  const fetchJobs = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const weekStart = getWeekStart(currentWeek);
      const cacheKey = `${CACHE_KEYS.CALENDAR}_${weekStart}`;
      
      // Si se fuerza refresh, limpiar caché primero
      if (forceRefresh && localCache) {
        localCache.clear(cacheKey);
      }
      
      const data = await apiGet<{ jobs: Job[] }>(`/api/calendar?weekStart=${weekStart}`, cacheKey, { forceRefresh });
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

  const handleDateChange = async (jobId: string, newDate: string) => {
    try {
      const weekStart = getWeekStart(currentWeek);
      const cacheKey = `${CACHE_KEYS.CALENDAR}_${weekStart}`;
      
      // Actualizar optimistamente en caché
      const updatedJobs = jobs.map(job => 
        job.id === jobId ? { ...job, date: newDate } : job
      );
      setJobs(updatedJobs);
      
      // Sincronizar en segundo plano
      await apiPut(
        `/api/calendar/${jobId}`,
        { date: newDate },
        cacheKey,
        () => {
          // Actualizar caché después de sincronización exitosa
          return { jobs: updatedJobs };
        }
      );
      
      // Limpiar caché y forzar recarga desde el servidor
      if (localCache) {
        localCache.clear(cacheKey);
      }
      await fetchJobs(true); // Forzar refresh
    } catch (error) {
      console.error('Error updating date:', error);
      // Revertir cambio optimista
      await fetchJobs();
      alert('Errore nell\'aggiornamento della data');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo evento?')) return;

    try {
      const weekStart = getWeekStart(currentWeek);
      const cacheKey = `${CACHE_KEYS.CALENDAR}_${weekStart}`;
      
      // Actualizar optimistamente en caché
      const updatedJobs = jobs.filter(job => job.id !== jobId);
      setJobs(updatedJobs);
      
      // Sincronizar en segundo plano
      await apiDelete(
        `/api/calendar/${jobId}`,
        cacheKey,
        () => {
          return { jobs: updatedJobs };
        }
      );
      
      // Limpiar caché y forzar recarga desde el servidor
      if (localCache) {
        localCache.clear(cacheKey);
      }
      await fetchJobs(true); // Forzar refresh
    } catch (error) {
      console.error('Error deleting job:', error);
      // Revertir cambio optimista
      await fetchJobs();
      alert('Errore nell\'eliminazione dell\'evento');
    }
  };

  const handleCreateJob = async (formData: {
    date: string;
    startTime: string;
    endTime: string;
    clientId?: string;
    propertyId?: string;
    clientName?: string;
    propertyName?: string;
    cleaningType: string;
    resources?: Array<{ id: string; name: string }>;
    isSpecialCase?: boolean;
  }) => {
    try {
      const weekStart = getWeekStart(new Date(formData.date));
      const cacheKey = `${CACHE_KEYS.CALENDAR}_${weekStart}`;
      
      await apiPost(
        '/api/calendar',
        {
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          clientId: formData.clientId,
          propertyId: formData.propertyId,
          clientName: formData.clientName,
          propertyName: formData.propertyName,
          cleaningType: formData.cleaningType,
          resources: formData.resources || [],
          isSpecialCase: formData.isSpecialCase,
        },
        cacheKey,
        (data, response, current) => {
          // Agregar nuevo job al caché optimistamente
          const currentJobs = (current as { jobs?: Job[] })?.jobs || jobs;
          const responseData = response as { id?: string } | undefined;
          const client = clients.find(c => c.id === formData.clientId);
          const property = client?.properties.find(p => p.id === formData.propertyId);
          const newJob: Job = {
            id: responseData?.id || Date.now().toString(),
            date: formData.date,
            day: new Date(formData.date).toLocaleDateString('it-IT', { weekday: 'long' }),
            startTime: formData.startTime,
            endTime: formData.endTime,
            type: 'Lavoro',
            cleaningType: formData.cleaningType,
            propertyId: formData.propertyId || '',
            propertyName: property?.location || '',
            clientId: formData.clientId || '',
            client: client?.name || '',
            resource1Id: '',
            resource1Name: '',
            resource2Id: '',
            resource2Name: '',
            resource3Id: '',
            resource3Name: '',
            resource4Id: '',
            resource4Name: '',
            resource5Id: '',
            resource5Name: '',
            resource6Id: '',
            resource6Name: '',
            coordinatorId: '',
            hoursWorked: '',
            status: 'Pianificato',
            notes: '',
          };
          
          return { jobs: [...currentJobs, newJob] };
        }
      );
      
      // Limpiar caché y forzar recarga desde el servidor
      if (localCache) {
        localCache.clear(cacheKey);
      }
      await fetchJobs(true); // Forzar refresh
      setShowModal(false);
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
    clientId?: string;
    clientName?: string;
    propertyName?: string;
    cleaningType?: string;
    resources?: Array<{ id: string; name: string }>;
    isSpecialCase?: boolean;
  }) => {
    try {
      const updateData: Record<string, string> = {};
      
      if (formData.date) updateData.date = formData.date;
      if (formData.startTime) updateData.startTime = formData.startTime;
      if (formData.endTime) updateData.endTime = formData.endTime;
      if (formData.cleaningType !== undefined) updateData.cleaningType = formData.cleaningType;
      
      // Manejar casos especiales vs casos normales
      if (formData.isSpecialCase) {
        updateData.isSpecialCase = 'true';
        if (formData.clientName) updateData.clientName = formData.clientName;
        if (formData.propertyName) updateData.propertyName = formData.propertyName;
      } else {
        if (formData.propertyId) updateData.propertyId = formData.propertyId;
        if (formData.clientId) updateData.clientId = formData.clientId;
      }

      if (formData.resources !== undefined) {
        for (let i = 1; i <= 11; i++) {
          updateData[`resource${i}Id`] = '';
          updateData[`resource${i}Name`] = '';
        }
        formData.resources.forEach((resource, index) => {
          if (resource.id && index < 11) {
            updateData[`resource${index + 1}Id`] = resource.id;
          }
        });
      }

      const weekStart = formData.date ? getWeekStart(new Date(formData.date)) : getWeekStart(currentWeek);
      const cacheKey = `${CACHE_KEYS.CALENDAR}_${weekStart}`;
      
      // Actualizar optimistamente en caché
      const updatedJobs = jobs.map(job => {
        if (job.id === jobId) {
          return {
            ...job,
            ...updateData,
            propertyName: formData.propertyId 
              ? clients.find(c => c.id === job.clientId)?.properties.find(p => p.id === formData.propertyId)?.location || job.propertyName
              : job.propertyName,
          };
        }
        return job;
      });
      setJobs(updatedJobs);
      
      // Sincronizar en segundo plano
      await apiPut(
        `/api/calendar/${jobId}`,
        updateData,
        cacheKey,
        () => {
          // Usar los jobs actualizados que ya calculamos
          return { jobs: updatedJobs };
        }
      );
      
      // Limpiar caché y forzar recarga desde el servidor
      if (localCache) {
        localCache.clear(cacheKey);
      }
      await fetchJobs(true); // Forzar refresh
      setShowModal(false);
      setEditingJob(null);
    } catch (error) {
      console.error('Error updating job:', error);
      // Revertir cambio optimista
      await fetchJobs();
      const errorMessage = error instanceof Error ? error.message : 'Errore nell\'aggiornamento dell\'evento';
      alert(errorMessage);
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
            onClick={() => {
              setSelectedDate('');
              setEditingJob(null);
              setShowModal(true);
            }}
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
              <div key={dayIndex} className="p-2 border-r last:border-r-0 border-b min-h-[200px] relative flex flex-col">
                {/* Botón de agregar evento siempre visible arriba de todo */}
                <button
                  onClick={() => {
                    setSelectedDate(dayStr);
                    setEditingJob(null);
                    setShowModal(true);
                  }}
                  className="mb-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded border border-blue-200 w-full font-medium"
                  title={`Aggiungi evento per ${dayStr}`}
                >
                  + Aggiungi Evento
                </button>
                
                {dayJobs.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center mt-2">
                    Nessun lavoro
                  </div>
                ) : (
                  <div className="space-y-2 flex-1">
                    {dayJobs.map((job) => {
                      // Obtener clientId del job o buscarlo por nombre
                      const jobClientId = job.clientId || clients.find(c => c.name === job.client)?.id || '';
                      const clientColor = getClientColor(jobClientId, clients);
                      // Verificar si es caso especial (clientId = 'SPECIAL' o notes contiene 'Caso Speciale')
                      const isSpecialCase = job.clientId === 'SPECIAL' || job.notes?.includes('Caso Speciale');
                      return (
                        <div
                          key={job.id}
                          className={`p-2 rounded text-xs border ${clientColor} ${isSpecialCase ? 'ring-2 ring-orange-400 border-orange-500' : ''}`}
                        >
                          {isSpecialCase && (
                            <div className="mb-1">
                              <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 rounded">
                                ⭐ Caso Speciale
                              </span>
                            </div>
                          )}
                          <div className="flex justify-end gap-1 mb-1">
                            <button
                              onClick={() => {
                                setEditingJob(job);
                                setShowModal(true);
                              }}
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

                          <div className="font-semibold mb-1">{job.propertyName || 'Lavoro'}</div>
                          
                          {job.client && (
                            <div className="text-xs text-gray-600 mb-1">Cliente: {job.client}</div>
                          )}

                          <div className="text-gray-600 mb-1">
                            <span className="text-xs font-medium">Data:</span>{' '}
                            <input
                              type="date"
                              value={job.date}
                              onChange={(e) => handleDateChange(job.id, e.target.value)}
                              className="text-xs border-0 bg-transparent p-0 cursor-pointer hover:underline focus:outline-none focus:underline"
                              title="Clicca per cambiare data"
                            />
                          </div>
                          
                          {job.cleaningType && (
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              {job.cleaningType === 'Profonda' ? '🧹 Profonda' : '✨ Repasso'}
                            </div>
                          )}

                          <div className="text-gray-600 mb-2">
                            <span className="text-xs font-medium">Inizio:</span> {formatTime(job.startTime)}
                            {' | '}
                            <span className="text-xs font-medium">Fine:</span> {formatTime(job.endTime)}
                          </div>

                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <div className="text-xs font-medium text-gray-700 mb-1">Dipendenti:</div>
                            <div className="space-y-1">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
                                const resourceName = job[`resource${num}Name` as keyof Job] as string;
                                if (!resourceName) return null;
                                return (
                                  <div key={num} className="text-xs text-gray-600">
                                    {num}. {resourceName}
                                  </div>
                                );
                              })}
                            </div>
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

      {showModal && (
        <EventModal
          clients={clients}
          resources={resources}
          initialDate={selectedDate || editingJob?.date || ''}
          job={editingJob}
          onClose={() => {
            setShowModal(false);
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

// Componente Modal con blur
function EventModal({
  clients,
  resources,
  initialDate,
  job,
  onClose,
  onSubmit,
}: {
  clients: Client[];
  resources: Resource[];
  initialDate: string;
  job: Job | null;
  onClose: () => void;
  onSubmit: (data: {
    date?: string;
    startTime?: string;
    endTime?: string;
    clientId?: string;
    propertyId?: string;
    clientName?: string;
    propertyName?: string;
    cleaningType?: string;
    resources?: Array<{ id: string; name: string }>;
    isSpecialCase?: boolean;
  }) => void;
}) {
  const [formData, setFormData] = useState({
    date: initialDate || job?.date || '',
    startTime: job?.startTime || '',
    endTime: job?.endTime || '',
    clientId: '',
    propertyId: job?.propertyId || '',
    clientName: '',
    propertyName: '',
    cleaningType: job?.cleaningType || '',
    selectedResources: [] as Array<{ id: string; name: string }>,
    isSpecialCase: false,
  });

  // Actualizar fecha cuando cambia initialDate (cuando se hace clic desde un día específico)
  useEffect(() => {
    if (initialDate && !job) {
      // Solo actualizar si no estamos editando un job existente
      setFormData(prev => ({ ...prev, date: initialDate }));
    }
  }, [initialDate, job]);

  useEffect(() => {
    if (job) {
      // Verificar si es caso especial
      const isSpecial = job.clientId === 'SPECIAL' || job.notes?.includes('Caso Speciale');
      
      if (isSpecial) {
        // Es caso especial: usar nombres directamente
        setFormData(prev => ({
          ...prev,
          isSpecialCase: true,
          clientName: job.client || '',
          propertyName: job.propertyName || '',
          clientId: '',
          propertyId: '',
        }));
      } else if (job.client && clients.length > 0) {
        // Caso normal: buscar cliente en la lista
        const client = clients.find(c => c.name === job.client);
        if (client) {
          setFormData(prev => ({ ...prev, clientId: client.id }));
        }
      }
    }
  }, [job, clients]);

  useEffect(() => {
    if (job) {
      const jobResources: Array<{ id: string; name: string }> = [];
      for (let i = 1; i <= 11; i++) {
        const resourceId = job[`resource${i}Id` as keyof Job] as string;
        const resourceName = job[`resource${i}Name` as keyof Job] as string;
        if (resourceId && resourceName) {
          jobResources.push({ id: resourceId, name: resourceName });
        }
      }
      setFormData(prev => ({ 
        ...prev, 
        selectedResources: jobResources.length > 0 ? jobResources : [{ id: '', name: '' }]
      }));
    } else {
      setFormData(prev => {
        if (prev.selectedResources.length === 0) {
          return { ...prev, selectedResources: [{ id: '', name: '' }] };
        }
        return prev;
      });
    }
  }, [job]);


  const selectedClient = clients.find(c => c.id === formData.clientId);
  const availableProperties = selectedClient?.properties || [];

  const getAvailableResourcesForIndex = (index: number) => {
    const selectedResourceIds = formData.selectedResources
      .map((r, i) => i !== index ? r.id : '')
      .filter(Boolean);
    return resources.filter(r => !selectedResourceIds.includes(r.id));
  };

  const handleAddResource = () => {
    if (formData.selectedResources.length < 11) {
      setFormData(prev => ({
        ...prev,
        selectedResources: [...prev.selectedResources, { id: '', name: '' }],
      }));
    }
  };

  const handleResourceChange = (index: number, resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    if (resource) {
      const fullName = `${resource.name} ${resource.surname}`.trim();
      const updated = [...formData.selectedResources];
      updated[index] = { id: resourceId, name: fullName };
      setFormData(prev => ({ ...prev, selectedResources: updated }));
    }
  };

  const handleRemoveResource = (index: number) => {
    const updated = formData.selectedResources.filter((_, i) => i !== index);
    setFormData(prev => ({ 
      ...prev, 
      selectedResources: updated.length > 0 ? updated : [{ id: '', name: '' }]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
      alert('Per favore, compila la data');
      return;
    }
    
    if (formData.isSpecialCase) {
      // Para casos especiales, cliente y propiedad son texto libre
      if (!formData.clientName || !formData.propertyName) {
        alert('Per favore, compila cliente e proprietà per il caso speciale');
        return;
      }
    } else {
      // Para casos normales, cliente y propiedad deben ser seleccionados
      if (!formData.clientId || !formData.propertyId) {
        alert('Per favore, compila tutti i campi obbligatori');
        return;
      }
    }
    
    onSubmit({
      ...formData,
      resources: formData.selectedResources.filter(r => r.id),
    });
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Backdrop con blur */}
      <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
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

          {/* Checkbox para caso especial */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isSpecialCase"
              checked={formData.isSpecialCase}
              onChange={(e) => setFormData({ 
                ...formData, 
                isSpecialCase: e.target.checked,
                clientId: e.target.checked ? '' : formData.clientId,
                propertyId: e.target.checked ? '' : formData.propertyId,
                clientName: e.target.checked ? formData.clientName : '',
                propertyName: e.target.checked ? formData.propertyName : '',
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isSpecialCase" className="ml-2 block text-sm text-gray-700">
              Caso Speciale / Una Sola Volta (per fatturazione)
            </label>
          </div>

          {formData.isSpecialCase ? (
            <>
              {/* Campos de texto libre para caso especial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente / Azienda *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Inserisci nome cliente o azienda"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proprietà / Indirizzo *
                </label>
                <input
                  type="text"
                  value={formData.propertyName}
                  onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Inserisci indirizzo o descrizione"
                  required
                />
              </div>
            </>
          ) : (
            <>
              {/* Campos normales con dropdown */}
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
            </>
          )}

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dipendenti
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {formData.selectedResources.map((resource, index) => {
                const availableForThisIndex = getAvailableResourcesForIndex(index);
                return (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                    <select
                      value={resource.id}
                      onChange={(e) => handleResourceChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Seleziona dipendente</option>
                      {availableForThisIndex.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.surname}
                        </option>
                      ))}
                      {resource.id && !availableForThisIndex.find(r => r.id === resource.id) && (
                        <option value={resource.id}>
                          {resource.name}
                        </option>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveResource(index)}
                      className="text-red-500 hover:text-red-700 text-sm px-2"
                      title="Rimuovi"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
              {formData.selectedResources.length < 11 && (
                <button
                  type="button"
                  onClick={handleAddResource}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 underline mt-2"
                >
                  + Aggiungi dipendente
                </button>
              )}
            </div>
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

