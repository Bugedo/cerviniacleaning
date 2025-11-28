'use client';

import { useState, useEffect, useRef } from 'react';

interface Resource {
  id: string;
  name: string;
  surname: string;
  role: string;
}

interface ResourceSearchProps {
  value: string; // resourceName actual
  resourceId: string; // resourceId actual
  onSelect: (resourceId: string, resourceName: string) => void;
  placeholder?: string;
  excludedResourceIds?: string[]; // IDs de recursos ya seleccionados en este trabajo
}

export default function ResourceSearch({
  value,
  resourceId,
  onSelect,
  placeholder = 'Cerca dipendente...',
  excludedResourceIds = [],
}: ResourceSearchProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    // Filtrar recursos excluidos (excepto el actual si está seleccionado)
    const availableResources = resources.filter((resource) => {
      // Si es el recurso actual, siempre incluirlo
      if (resource.id === resourceId) return true;
      // Excluir recursos ya seleccionados
      return !excludedResourceIds.includes(resource.id);
    });

    if (searchTerm.trim() === '') {
      setFilteredResources(availableResources);
    } else {
      const filtered = availableResources.filter((resource) => {
        const fullName = `${resource.name} ${resource.surname}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      });
      setFilteredResources(filtered);
    }
  }, [searchTerm, resources, excludedResourceIds, resourceId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources');
      if (!response.ok) throw new Error('Error al cargar recursos');
      const data = await response.json();
      
      // Filtrar solo empleados que NO son coordinadores
      const employees = (data.resources || []).filter(
        (resource: Resource) => resource.role !== 'Coordinatore'
      );
      
      setResources(employees);
      setFilteredResources(employees);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources([]);
      setFilteredResources([]);
    }
  };

  const handleSelect = (resource: Resource) => {
    const fullName = `${resource.name} ${resource.surname}`.trim();
    onSelect(resource.id, fullName);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <input
        type="text"
        value={showDropdown ? searchTerm : value || ''}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded"
      />
      {showDropdown && filteredResources.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto">
          {filteredResources.map((resource) => {
            const fullName = `${resource.name} ${resource.surname}`.trim();
            return (
              <button
                key={resource.id}
                type="button"
                onClick={() => handleSelect(resource)}
                className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                {fullName}
              </button>
            );
          })}
        </div>
      )}
      {showDropdown && filteredResources.length === 0 && searchTerm.trim() !== '' && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg">
          <div className="px-2 py-1 text-xs text-gray-500">Nessun risultato</div>
        </div>
      )}
    </div>
  );
}

