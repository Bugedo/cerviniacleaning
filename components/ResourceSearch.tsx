'use client';

import { useState, useEffect } from 'react';

interface Resource {
  id: string;
  name: string;
  surname: string;
  role: string;
}

interface ResourceSearchProps {
  value: string;
  resourceId: string;
  onSelect: (id: string, name: string) => void;
  placeholder?: string;
  excludedResourceIds?: string[];
}

export default function ResourceSearch({
  value,
  onSelect,
  placeholder = 'Cerca dipendente...',
  excludedResourceIds = [],
}: ResourceSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources');
      if (!response.ok) throw new Error('Error al cargar recursos');
      const data = await response.json();
      const allResources = data.resources || [];

      // Filtrar coordinadores y asistentes coordinadores, y excluir los ya seleccionados
      const availableResources = allResources.filter(
        (r: Resource) =>
          r.role !== 'Coordinatore' &&
          r.role !== 'Assistente Coordinatore' &&
          !excludedResourceIds.includes(r.id)
      );

      setResources(availableResources);
      setFilteredResources(availableResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredResources(
        resources.filter(
          (r) => !excludedResourceIds.includes(r.id)
        )
      );
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = resources.filter(
        (r) =>
          !excludedResourceIds.includes(r.id) &&
          (`${r.name} ${r.surname}`.toLowerCase().includes(term) ||
            r.name.toLowerCase().includes(term) ||
            r.surname.toLowerCase().includes(term))
      );
      setFilteredResources(filtered);
    }
  }, [searchTerm, resources, excludedResourceIds]);

  const handleSelect = (resource: Resource) => {
    const fullName = `${resource.name} ${resource.surname}`.trim();
    onSelect(resource.id, fullName);
    setSearchTerm('');
    setShowDropdown(false);
  };

  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={searchTerm || value}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {showDropdown && filteredResources.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto">
          {filteredResources.map((resource) => {
            const fullName = `${resource.name} ${resource.surname}`.trim();
            return (
              <button
                key={resource.id}
                type="button"
                onClick={() => handleSelect(resource)}
                className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100"
              >
                {fullName}
              </button>
            );
          })}
        </div>
      )}
      {showDropdown && filteredResources.length === 0 && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 text-xs text-gray-500">
          Nessun risultato
        </div>
      )}
    </div>
  );
}
