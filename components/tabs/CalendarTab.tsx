'use client';

import { useState, useEffect } from 'react';

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
      'Gennaio',
      'Febbraio',
      'Marzo',
      'Aprile',
      'Maggio',
      'Giugno',
      'Luglio',
      'Agosto',
      'Settembre',
      'Ottobre',
      'Novembre',
      'Dicembre',
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
      alert("Errore nell'eliminazione dell'evento");
    }
  };

  const handleCreateJob = async (formData: {
    date: string;
    startTime: string;
    endTime: string;
    clientId: string;
    propertyId: string;
    cleaningType: string;
    resources?: Array<{ id: string; name: string }>;
  }) => {
    try {
      // Obtener nombres de cliente y propiedad
      const client = clients.find((c) => c.id === formData.clientId);
      if (!client) {
        alert('Cliente non trovato');
        return;
      }

      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          clientId: formData.clientId,
          propertyId: formData.propertyId,
          cleaningType: formData.cleaningType,
          resources: formData.resources || [],
        }),
      });

      if (!response.ok) throw new Error('Error al crear evento');

      await fetchJobs();
      setShowCreateModal(false);
      setSelectedDate('');
    } catch (error) {
      console.error('Error creating job:', error);
      alert("Errore nella creazione dell'evento");
    }
  };

  const handleEditJob = async (
    jobId: string,
    formData: {
      date?: string;
      startTime?: string;
      endTime?: string;
      propertyId?: string;
      cleaningType?: string;
      resources?: Array<{ id: string; name: string }>;
    },
  ) => {
    try {
      // Preparar datos para actualizar
      const updateData: Record<string, string> = {};

      if (formData.date) updateData.date = formData.date;
      if (formData.startTime) updateData.startTime = formData.startTime;
      if (formData.endTime) updateData.endTime = formData.endTime;
      if (formData.propertyId) updateData.propertyId = formData.propertyId;
      if (formData.cleaningType !== undefined) updateData.cleaningType = formData.cleaningType;

      // Actualizar recursos
      if (formData.resources !== undefined) {
        // Limpiar todos los recursos primero (tanto ID como nombre)
        for (let i = 1; i <= 11; i++) {
          updateData[`resource${i}Id`] = '';
          updateData[`resource${i}Name`] = '';
        }
        // Asignar nuevos recursos
        formData.resources.forEach((resource, index) => {
          if (resource.id && index < 11) {
            updateData[`resource${index + 1}Id`] = resource.id;
            // El nombre se actualizará automáticamente en la API
          }
        });
      }

      const response = await fetch(`/api/calendar/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Error al actualizar: ${response.status} ${response.statusText}`,
        );
      }

      await fetchJobs();
      setEditingJob(null);
    } catch (error) {
      console.error('Error updating job:', error);
      const errorMessage =
        error instanceof Error ? error.message : "Errore nell'aggiornamento dell'evento";
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
              <>
                {' '}
                - {getMonthName(weekDays[6])} {weekDays[6].getFullYear()}
              </>
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
              <div
                key={dayIndex}
                className="p-2 border-r last:border-r-0 border-b min-h-[200px] relative"
              >
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

                          {/* Nombre de propiedad - solo lectura */}
                          <div className="font-semibold mb-1">{job.propertyName || 'Lavoro'}</div>

                          {/* Cliente - solo lectura */}
                          {job.client && (
                            <div className="text-xs text-gray-600 mb-1">Cliente: {job.client}</div>
                          )}

                          {/* Fecha - solo lectura */}
                          <div className="text-gray-600 mb-1">
                            <span className="text-xs font-medium">Data:</span> {job.date}
                          </div>

                          {/* Tipo de limpieza - solo lectura */}
                          {job.cleaningType && (
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              {job.cleaningType === 'Profonda' ? '🧹 Profonda' : '✨ Repasso'}
                            </div>
                          )}

                          {/* Horario - solo lectura */}
                          <div className="text-gray-600 mb-2">
                            <span className="text-xs font-medium">Inizio:</span>{' '}
                            {formatTime(job.startTime) || '--:--'}
                            {' | '}
                            <span className="text-xs font-medium">Fine:</span>{' '}
                            {formatTime(job.endTime) || '--:--'}
                          </div>

                          {/* Empleados - solo lectura */}
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              Dipendenti:
                            </div>
                            <div className="space-y-1">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
                                const resourceName = job[
                                  `resource${num}Name` as keyof Job
                                ] as string;
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
          onSubmit={editingJob ? (data) => handleEditJob(editingJob.id, data) : handleCreateJob}
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
    resources?: Array<{ id: string; name: string }>;
  }) => void;
}) {
  const [resources, setResources] = useState<
    Array<{ id: string; name: string; surname: string; role: string }>
  >([]);
  const [formData, setFormData] = useState({
    date: initialDate || job?.date || '',
    startTime: job?.startTime || '',
    endTime: job?.endTime || '',
    clientId: '',
    propertyId: job?.propertyId || '',
    cleaningType: job?.cleaningType || '',
    selectedResources: [] as Array<{ id: string; name: string }>,
  });

  // Inicializar clientId cuando cambie job o clients
  useEffect(() => {
    if (job?.client && clients.length > 0) {
      const client = clients.find((c) => c.name === job.client);
      if (client) {
        setFormData((prev) => ({ ...prev, clientId: client.id }));
      }
    }
  }, [job, clients]);

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    // Inicializar recursos del job si existe
    if (job) {
      const jobResources: Array<{ id: string; name: string }> = [];
      for (let i = 1; i <= 11; i++) {
        const resourceId = job[`resource${i}Id` as keyof Job] as string;
        const resourceName = job[`resource${i}Name` as keyof Job] as string;
        if (resourceId && resourceName) {
          jobResources.push({ id: resourceId, name: resourceName });
        }
      }
      setFormData((prev) => ({
        ...prev,
        selectedResources: jobResources.length > 0 ? jobResources : [{ id: '', name: '' }],
      }));
    } else {
      // Si no hay job, empezar con un recurso vacío
      setFormData((prev) => {
        if (prev.selectedResources.length === 0) {
          return { ...prev, selectedResources: [{ id: '', name: '' }] };
        }
        return prev;
      });
    }
  }, [job]);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources');
      if (!response.ok) throw new Error('Error al cargar recursos');
      const data = await response.json();
      // Filtrar solo empleados que NO son coordinadores ni asistentes coordinadores
      const employees = (data.resources || []).filter((resource: { role: string }) => {
        const role = (resource.role || '').toLowerCase();
        return (
          !role.includes('coordinatore') &&
          !role.includes('coordinador') &&
          !role.includes('assistente coordinatore') &&
          !role.includes('asistente coordinador')
        );
      });
      setResources(employees);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources([]);
    }
  };

  const selectedClient = clients.find((c) => c.id === formData.clientId);
  const availableProperties = selectedClient?.properties || [];

  // Obtener IDs de recursos ya seleccionados para filtrar
  // Función para obtener recursos disponibles para un índice específico
  const getAvailableResourcesForIndex = (index: number) => {
    const selectedResourceIds = formData.selectedResources
      .map((r, i) => (i !== index ? r.id : ''))
      .filter(Boolean);
    return resources.filter((r) => !selectedResourceIds.includes(r.id));
  };

  const handleAddResource = () => {
    if (formData.selectedResources.length < 11) {
      setFormData((prev) => ({
        ...prev,
        selectedResources: [...prev.selectedResources, { id: '', name: '' }],
      }));
    }
  };

  const handleResourceChange = (index: number, resourceId: string) => {
    const resource = resources.find((r) => r.id === resourceId);
    if (resource) {
      const fullName = `${resource.name} ${resource.surname}`.trim();
      const updated = [...formData.selectedResources];
      updated[index] = { id: resourceId, name: fullName };
      setFormData((prev) => ({ ...prev, selectedResources: updated }));
    }
  };

  const handleRemoveResource = (index: number) => {
    const updated = formData.selectedResources.filter((_, i) => i !== index);
    // Si no quedan recursos, agregar uno vacío
    setFormData((prev) => ({
      ...prev,
      selectedResources: updated.length > 0 ? updated : [{ id: '', name: '' }],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.clientId || !formData.propertyId) {
      alert('Per favore, compila tutti i campi obbligatori');
      return;
    }
    onSubmit({
      ...formData,
      resources: formData.selectedResources.filter((r) => r.id),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">{job ? 'Modifica Evento' : 'Nuovo Evento'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Ora Inizio</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ora Fine</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select
              value={formData.clientId}
              onChange={(e) =>
                setFormData({ ...formData, clientId: e.target.value, propertyId: '' })
              }
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Proprietà *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo di Pulizia</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Dipendenti</label>
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
                      {resource.id && !availableForThisIndex.find((r) => r.id === resource.id) && (
                        <option value={resource.id}>{resource.name}</option>
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
