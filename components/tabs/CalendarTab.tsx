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
  coordinatorId: string;
  hoursWorked: string;
  status: string;
  notes: string;
}

export default function CalendarTab() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<{ jobId: string; field: 'startTime' | 'endTime' } | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const weekStart = getWeekStart(currentWeek);
      const response = await fetch(`/api/calendar?weekStart=${weekStart}`);
      if (!response.ok) throw new Error('Error al cargar calendario');
      const data = await response.json();
      setJobs(data.jobs || []);
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

      if (!response.ok) {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error saving time:', error);
      alert('Errore nel salvataggio. Riprova.');
      // Recargar para revertir cambios
      fetchJobs();
    } finally {
      setSaving((prev) => ({ ...prev, [`${jobId}-${field}`]: false }));
      setEditingTime(null);
    }
  };

  const weekStart = getWeekStart(currentWeek);
  const weekDays = getWeekDays(weekStart);

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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Calendario</h2>
        <div className="flex items-center gap-2">
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

        <div className="grid grid-cols-7 min-h-[400px]">
          {weekDays.map((day, dayIndex) => {
            const dayJobs = getJobsForDay(day);
            return (
              <div key={dayIndex} className="p-2 border-r last:border-r-0 border-b min-h-[100px]">
                {dayJobs.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center mt-2">Nessun lavoro</div>
                ) : (
                  <div className="space-y-2">
                    {dayJobs.map((job) => {
                      const isExpanded = expandedJob === job.id;
                      const isEditingStart = editingTime?.jobId === job.id && editingTime.field === 'startTime';
                      const isEditingEnd = editingTime?.jobId === job.id && editingTime.field === 'endTime';
                      const isSavingStart = saving[`${job.id}-startTime`];
                      const isSavingEnd = saving[`${job.id}-endTime`];

                      return (
                        <div
                          key={job.id}
                          className={`p-2 rounded text-xs ${
                            job.type === 'Supervisione'
                              ? 'bg-blue-100 border border-blue-300'
                              : 'bg-green-100 border border-green-300'
                          }`}
                        >
                          {/* Vista compacta: Solo propiedad, tipo de limpieza y horario */}
                          <div className="font-semibold mb-1">
                            {job.type === 'Supervisione'
                              ? '👁️ Supervisione'
                              : job.propertyName || 'Lavoro'}
                          </div>
                          
                          {job.cleaningType && (
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              {job.cleaningType === 'Profonda' ? '🧹 Profonda' : '✨ Repasso'}
                            </div>
                          )}

                          {/* Horario editable */}
                          <div className="text-gray-600 mb-1">
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
                                {formatTime(job.startTime)}
                                {isSavingStart && ' ...'}
                              </span>
                            )}
                            {job.endTime && (
                              <>
                                {' - '}
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
                                    {formatTime(job.endTime)}
                                    {isSavingEnd && ' ...'}
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {/* Botón para más info */}
                          <button
                            onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
                          >
                            {isExpanded ? 'Meno info' : 'Più info'}
                          </button>

                          {/* Información expandida: Empleados y horas */}
                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t border-gray-300">
                              {[
                                job.resource1Name,
                                job.resource2Name,
                                job.resource3Name,
                                job.resource4Name,
                                job.resource5Name,
                                job.resource6Name,
                              ]
                                .filter(Boolean)
                                .length > 0 && (
                                <div className="text-gray-600 mb-1">
                                  <span className="font-medium">Dipendenti:</span>{' '}
                                  {[
                                    job.resource1Name,
                                    job.resource2Name,
                                    job.resource3Name,
                                    job.resource4Name,
                                    job.resource5Name,
                                    job.resource6Name,
                                  ]
                                    .filter(Boolean)
                                    .join(', ')}
                                </div>
                              )}
                              {job.hoursWorked && (
                                <div className="text-gray-600">
                                  <span className="font-medium">Tempo:</span> {job.hoursWorked}h
                                </div>
                              )}
                            </div>
                          )}
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
    </div>
  );
}
