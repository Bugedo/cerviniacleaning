'use client';

import { useState, useEffect } from 'react';
import ResourceSearch from '@/components/ResourceSearch';

interface Resource {
  id: string;
  name: string;
}

interface Job {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
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
}

interface ResourceManagerProps {
  job: Job;
  onUpdate: () => void;
}

function calculateHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  const diffMinutes = endMinutes - startMinutes;
  return diffMinutes / 60;
}

export default function ResourceManager({ job, onUpdate }: ResourceManagerProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Obtener recursos actuales del job
  const getCurrentResources = (): Resource[] => {
    const current: Resource[] = [];
    for (let i = 1; i <= 11; i++) {
      const id = job[`resource${i}Id` as keyof Job] as string;
      const name = job[`resource${i}Name` as keyof Job] as string;
      if (id && name) {
        current.push({ id, name });
      }
    }
    return current;
  };

  useEffect(() => {
    const current = getCurrentResources();
    // Si no hay recursos, empezar con uno vacío
    if (current.length === 0) {
      setResources([{ id: '', name: '' }]);
    } else {
      setResources(current);
    }
    setEditingIndex(null);
  }, [job.id, job.resource1Id, job.resource2Id, job.resource3Id, job.resource4Id, job.resource5Id, job.resource6Id]);

  const currentResources = getCurrentResources();
  const selectedResourceIds = currentResources.map(r => r.id).filter(Boolean);

  const handleResourceSelect = async (index: number, resourceId: string, resourceName: string) => {
    // Actualizar estado local
    const updated = [...resources];
    updated[index] = { id: resourceId, name: resourceName };
    setResources(updated);

    // Guardar en el servidor
    try {
      const response = await fetch(`/api/calendar/${job.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [`resource${index + 1}Id`]: resourceId,
        }),
      });

      if (!response.ok) throw new Error('Error al guardar');
      
      await onUpdate();
    } catch (error) {
      console.error('Error saving resource:', error);
      alert('Errore nel salvataggio del dipendente');
      // Revertir cambios
      setResources(getCurrentResources());
    }
    
    setEditingIndex(null);
  };

  const handleAddResource = () => {
    if (resources.length < 11) {
      setResources([...resources, { id: '', name: '' }]);
      setEditingIndex(resources.length);
    }
  };

  const handleRemoveResource = async (index: number) => {
    if (!confirm('Sei sicuro di voler rimuovere questo dipendente?')) return;

    const resourceToRemove = resources[index];
    if (!resourceToRemove.id) {
      // Si no tiene ID, solo remover del estado local
      const updated = resources.filter((_, i) => i !== index);
      setResources(updated.length > 0 ? updated : [{ id: '', name: '' }]);
      return;
    }

    try {
      // Eliminar el recurso del servidor
      const response = await fetch(`/api/calendar/${job.id}/resource`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceIndex: index + 1,
          resourceId: resourceToRemove.id,
        }),
      });

      if (!response.ok) throw new Error('Error al eliminar');

      // Actualizar estado local
      const updated = resources.filter((_, i) => i !== index);
      setResources(updated.length > 0 ? updated : [{ id: '', name: '' }]);
      
      await onUpdate();
    } catch (error) {
      console.error('Error removing resource:', error);
      alert('Errore nella rimozione del dipendente');
    }
  };

  return (
    <div className="space-y-1">
      {resources.map((resource, index) => {
        const isEditing = editingIndex === index;
        const hasResource = resource.id && resource.name;

        return (
          <div key={index} className="flex items-center gap-1">
            <span className="text-xs text-gray-500 w-4">{index + 1}:</span>
            {isEditing ? (
              <div className="flex-1 flex items-center gap-1">
                <ResourceSearch
                  value={resource.name || ''}
                  resourceId={resource.id || ''}
                  onSelect={(id, name) => handleResourceSelect(index, id, name)}
                  placeholder="Cerca dipendente..."
                  excludedResourceIds={selectedResourceIds.filter(id => id !== resource.id)}
                />
                <button
                  onClick={() => setEditingIndex(null)}
                  className="text-gray-400 hover:text-gray-600 text-xs px-1"
                  title="Annulla"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-1">
                <span
                  onClick={() => setEditingIndex(index)}
                  className="flex-1 cursor-pointer hover:bg-gray-200 px-1 py-0.5 rounded text-xs"
                  title="Clicca per modificare"
                >
                  {resource.name || '---'}
                </span>
                {hasResource && (
                  <button
                    onClick={() => handleRemoveResource(index)}
                    className="text-red-500 hover:text-red-700 text-xs px-1"
                    title="Rimuovi"
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      {resources.length < 11 && (
        <button
          onClick={handleAddResource}
          className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
        >
          + Aggiungi dipendente
        </button>
      )}
    </div>
  );
}

