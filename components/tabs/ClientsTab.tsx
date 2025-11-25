'use client';

import { useState, useEffect } from 'react';

interface Property {
  id: string;
  clientId: string;
  clientName: string;
  ownerName: string;
  location: string;
  typology: string;
  agencyContact: string;
  contact: string;
  doormanContact: string;
  accessInfo: string;
  buildingEntry: string;
  keys: string;
  mapsLink: string;
  services: string;
  welcomeKit: string;
  parking: string;
  specialNotes: string;
  timing: string;
  washingMachine: string;
  dishwasher: string;
  doubleBeds: string;
  singleBeds: string;
  bedType: string;
  bathrooms: string;
  referenceCode: string;
  comments: string;
}

interface Client {
  id: string;
  name: string;
  properties: Property[];
}

export default function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = clients
        .map((client) => ({
          ...client,
          properties: client.properties.filter(
            (prop) =>
              client.name.toLowerCase().includes(term) ||
              prop.location.toLowerCase().includes(term) ||
              prop.ownerName.toLowerCase().includes(term)
          ),
        }))
        .filter((client) => client.properties.length > 0 || client.name.toLowerCase().includes(term));
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Error al cargar clientes');
      }
      const data = await response.json();
      setClients(data.clients || []);
      setFilteredClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
      setFilteredClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (
    clientId: string,
    propertyId: string,
    field: keyof Property,
    value: string
  ) => {
    setClients((prevClients) =>
      prevClients.map((client) =>
        client.id === clientId
          ? {
              ...client,
              properties: client.properties.map((prop) =>
                prop.id === propertyId ? { ...prop, [field]: value } : prop
              ),
            }
          : client
      )
    );
    setFilteredClients((prevClients) =>
      prevClients.map((client) =>
        client.id === clientId
          ? {
              ...client,
              properties: client.properties.map((prop) =>
                prop.id === propertyId ? { ...prop, [field]: value } : prop
              ),
            }
          : client
      )
    );
  };

  const handleFieldBlur = async (propertyId: string, field: keyof Property, value: string) => {
    const fieldKey = `${propertyId}-${field}`;
    setSaving((prev) => ({ ...prev, [fieldKey]: true }));
    setSaved((prev) => ({ ...prev, [fieldKey]: false }));
    
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar');
      }

      // No recargar toda la página - el estado local ya está actualizado
      // Solo mostrar indicador de éxito
      setSaved((prev) => ({ ...prev, [fieldKey]: true }));
      
      // Ocultar el indicador de éxito después de 2 segundos
      setTimeout(() => {
        setSaved((prev) => ({ ...prev, [fieldKey]: false }));
      }, 2000);
    } catch (error) {
      console.error('Error saving property:', error);
      // Revertir el cambio en caso de error
      fetchClients();
      alert('Errore nel salvataggio. Riprova.');
    } finally {
      setSaving((prev) => ({ ...prev, [fieldKey]: false }));
    }
  };

  const fieldLabels: Record<keyof Property, string> = {
    id: 'ID',
    clientId: 'ID Cliente',
    clientName: 'Nome Cliente',
    ownerName: 'Nome Proprietario',
    location: 'Location',
    typology: 'Tipologia Locale',
    agencyContact: 'Nome Referente Agenzia',
    contact: 'Contatto Referente',
    doormanContact: 'Contatto Portineria',
    accessInfo: 'Informazioni Accesso',
    buildingEntry: 'Ingresso Stabile',
    keys: 'Chiavi',
    mapsLink: 'Link Google Maps',
    services: 'Servizi e Dettagli',
    welcomeKit: 'Kit di Benvenuto',
    parking: 'Presenza Parcheggio',
    specialNotes: 'Note Speciali',
    timing: 'Tempistiche',
    washingMachine: 'Lavatrice',
    dishwasher: 'Lavastoviglie',
    doubleBeds: 'Letti Matrimoniali',
    singleBeds: 'Letti Singoli',
    bedType: 'Letti Inglese/Italiana',
    bathrooms: 'Bagni',
    referenceCode: 'Codice Riferimento',
    comments: 'Commenti',
  };

  const editableFields: (keyof Property)[] = [
    'location', // Nombre de la propiedad - primero y más visible
    'ownerName',
    'typology',
    'agencyContact',
    'contact',
    'doormanContact',
    'accessInfo',
    'buildingEntry',
    'keys',
    'mapsLink',
    'services',
    'welcomeKit',
    'parking',
    'specialNotes',
    'timing',
    'washingMachine',
    'dishwasher',
    'doubleBeds',
    'singleBeds',
    'bedType',
    'bathrooms',
    'referenceCode',
    'comments',
  ];

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Clienti</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Clienti</h2>
        <div className="text-sm text-gray-500">
          {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clienti'}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Cerca per nome cliente, location o proprietario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">
              {searchTerm ? 'Nessun cliente trovato' : 'Nessun cliente disponibile'}
            </p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedClient(expandedClient === client.id ? null : client.id)
                }
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {client.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {client.properties.length}{' '}
                    {client.properties.length === 1 ? 'proprietà' : 'proprietà'}
                  </p>
                </div>
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    expandedClient === client.id ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {expandedClient === client.id && (
                <div className="border-t border-gray-200">
                  <div className="p-6 space-y-6">
                    {client.properties.map((property) => (
                      <div
                        key={`${client.id}-${property.id}`}
                        className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
                      >
                        <button
                          onClick={() =>
                            setExpandedProperty(
                              expandedProperty === property.id ? null : property.id
                            )
                          }
                          className="w-full flex justify-between items-center mb-4"
                        >
                          <h4 className="text-lg font-semibold text-gray-900">
                            {property.location || `Proprietà ${property.id}`}
                          </h4>
                          <svg
                            className={`h-5 w-5 text-gray-400 transition-transform ${
                              expandedProperty === property.id ? 'transform rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {expandedProperty === property.id && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {editableFields.map((field) => {
                              const fieldKey = `${property.id}-${field}`;
                              const isSaving = saving[fieldKey];
                              const isSaved = saved[fieldKey];
                              const isTextarea = ['accessInfo', 'services', 'welcomeKit', 'parking', 'specialNotes', 'comments'].includes(field);
                              const isLocation = field === 'location';
                              
                              return (
                                <div key={field} className={isTextarea || isLocation ? 'md:col-span-2' : ''}>
                                  <label className={`block text-sm font-medium mb-1 ${isLocation ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                                    {fieldLabels[field]}
                                    {isSaving && (
                                      <span className="ml-2 text-xs text-blue-600">Salvataggio...</span>
                                    )}
                                    {isSaved && !isSaving && (
                                      <span className="ml-2 text-xs text-green-600">✓ Salvato</span>
                                    )}
                                  </label>
                                  {isTextarea ? (
                                    <textarea
                                      value={property[field] || ''}
                                      onChange={(e) =>
                                        handleFieldChange(client.id, property.id, field, e.target.value)
                                      }
                                      onBlur={(e) =>
                                        handleFieldBlur(property.id, field, e.target.value)
                                      }
                                      rows={3}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={property[field] || ''}
                                      onChange={(e) =>
                                        handleFieldChange(client.id, property.id, field, e.target.value)
                                      }
                                      onBlur={(e) =>
                                        handleFieldBlur(property.id, field, e.target.value)
                                      }
                                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        isLocation ? 'text-base font-medium' : 'text-sm'
                                      }`}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
