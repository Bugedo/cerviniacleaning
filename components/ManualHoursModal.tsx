'use client';

import { useState, useEffect } from 'react';

interface ManualHour {
  id: string;
  resourceId: string;
  date: string;
  hours: number;
  notes?: string;
}

interface ManualHoursModalProps {
  resourceId: string;
  resourceName: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ManualHoursModal({
  resourceId,
  resourceName,
  onClose,
  onSave,
}: ManualHoursModalProps) {
  const [manualHours, setManualHours] = useState<ManualHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchManualHours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId]);

  const fetchManualHours = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/manual-hours?resourceId=${resourceId}`);
      if (!response.ok) throw new Error('Error al cargar horas manuales');
      const data = await response.json();
      setManualHours(data.manualHours || []);
    } catch (error) {
      console.error('Error fetching manual hours:', error);
      setManualHours([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDate || !hours || parseFloat(hours) <= 0) {
      alert('Per favore, compila data e ore');
      return;
    }

    try {
      // Si estamos editando, primero eliminamos la entrada antigua si la fecha cambió
      if (editingId) {
        const editingEntry = manualHours.find((mh) => mh.id === editingId);
        if (editingEntry && editingEntry.date !== selectedDate) {
          // Si cambió la fecha, eliminar la entrada antigua
          await fetch(`/api/manual-hours/${editingId}`, {
            method: 'DELETE',
          });
        }
      }

      // Crear o actualizar la entrada (la API maneja la actualización si ya existe para esa fecha)
      const response = await fetch('/api/manual-hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceId,
          date: selectedDate,
          hours: parseFloat(hours),
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) throw new Error('Error al guardar');

      await fetchManualHours();
      setSelectedDate('');
      setHours('');
      setNotes('');
      setEditingId(null);
      onSave();
    } catch (error) {
      console.error('Error saving manual hours:', error);
      alert('Errore nel salvataggio delle ore manuali');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare queste ore manuali?')) return;

    try {
      const response = await fetch(`/api/manual-hours/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      await fetchManualHours();
      onSave();
    } catch (error) {
      console.error('Error deleting manual hours:', error);
      alert("Errore nell'eliminazione delle ore manuali");
    }
  };

  const handleEdit = (mh: ManualHour) => {
    setEditingId(mh.id);
    setSelectedDate(mh.date);
    setHours(mh.hours.toString());
    setNotes(mh.notes || '');
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      {/* Backdrop con blur */}
      <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Ore Manuali - {resourceName}</h3>

        {/* Formulario para agregar/editar */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ore *</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Es: 2.5"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (opzionale)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Descrizione delle ore..."
            />
          </div>

          <div className="flex justify-end gap-2">
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setSelectedDate('');
                  setHours('');
                  setNotes('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingId ? 'Aggiorna' : 'Salva'}
            </button>
          </div>
        </div>

        {/* Lista de horas manuales */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Ore Manuali Registrate</h4>
          {loading ? (
            <p className="text-sm text-gray-500">Caricamento...</p>
          ) : manualHours.length === 0 ? (
            <p className="text-sm text-gray-500">Nessuna ora manuale registrata</p>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Data</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Ore</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Note</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {manualHours
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((mh) => (
                      <tr key={mh.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs text-gray-900">{formatDate(mh.date)}</td>
                        <td className="px-3 py-2 text-xs text-gray-900 font-semibold">
                          {mh.hours}h
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{mh.notes || '-'}</td>
                        <td className="px-3 py-2 text-xs">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(mh)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Modifica"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(mh.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Elimina"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
