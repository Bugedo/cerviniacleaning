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
      // Por ahora, usar datos mock si no hay sheets configurados
      setClients([]);
      setFilteredClients([]);
    } finally {
      setLoading(false);
    }
  };

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
                  <div className="p-6 space-y-4">
                    {client.properties.map((property) => (
                      <div
                        key={property.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              {property.location}
                            </h4>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Tipologia:</span> {property.typology}
                            </p>
                            {property.ownerName && (
                              <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Proprietario:</span> {property.ownerName}
                              </p>
                            )}
                            {property.contact && (
                              <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Contatto:</span> {property.contact}
                              </p>
                            )}
                          </div>
                          <div>
                            {property.timing && (
                              <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Tempistiche:</span> {property.timing}
                              </p>
                            )}
                            <div className="flex gap-4 mt-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {property.doubleBeds} letti matrimoniali
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {property.singleBeds} letti singoli
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {property.bathrooms} bagni
                              </span>
                            </div>
                            {property.specialNotes && (
                              <p className="text-sm text-gray-600 mt-2 italic">
                                {property.specialNotes.substring(0, 100)}
                                {property.specialNotes.length > 100 ? '...' : ''}
                              </p>
                            )}
                          </div>
                        </div>
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
