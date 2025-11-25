'use client';

import { useState, useEffect } from 'react';

interface Job {
  id: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  type: string;
  cleaningType: string; // "Profonda" o "Repasso"
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

  const getWeekStart = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes
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
                    {dayJobs.map((job) => (
                      <div
                        key={job.id}
                        className={`p-2 rounded text-xs ${
                          job.type === 'Supervisione'
                            ? 'bg-blue-100 border border-blue-300'
                            : 'bg-green-100 border border-green-300'
                        }`}
                      >
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
                        {job.startTime && (
                          <div className="text-gray-600">
                            {formatTime(job.startTime)}
                            {job.endTime && ` - ${formatTime(job.endTime)}`}
                          </div>
                        )}
                        {job.resource1Name && (
                          <div className="text-gray-600 mt-1">
                            👤{' '}
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
                          <div className="text-gray-600 mt-1">⏱️ {job.hoursWorked}h</div>
                        )}
                      </div>
                    ))}
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
