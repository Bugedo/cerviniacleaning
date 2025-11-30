import { getSpreadsheetData, appendSpreadsheetData } from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

async function addEscargoProperty() {
  try {
    const config = getSheetsConfig();

    console.log('🔄 Agregando propiedad "Escargo" para Andrea Bruzzo...\n');

    // Leer clientes
    const clientsData = await getSpreadsheetData(config.sheets.clients, 'Clienti!A:Z');
    const clientsRows = clientsData.slice(1);

    const andreaBruzzo = clientsRows.find((row) => row[1] === 'Andrea Bruzzo');
    if (!andreaBruzzo) {
      console.log('❌ No se encontró el cliente "Andrea Bruzzo"');
      return;
    }

    const clientId = andreaBruzzo[0];
    console.log(`✅ Cliente encontrado: "Andrea Bruzzo" (ID: ${clientId})\n`);

    // Leer propiedades para obtener el siguiente ID
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z');
    const propertiesRows = propertiesData.slice(1);

    // Encontrar el siguiente ID disponible
    let maxId = 0;
    propertiesRows.forEach((row) => {
      const id = parseInt(row[0] || '0');
      if (id > maxId) maxId = id;
    });
    const nextPropertyId = (maxId + 1).toString();

    console.log(`📝 Creando propiedad con ID: ${nextPropertyId}\n`);

    // Crear nueva propiedad Escargo
    // Estructura: ID, ID Cliente, Nome Cliente, Nome Proprietario, Location, ...
    const newProperty = [
      nextPropertyId, // ID
      clientId, // ID Cliente
      'Andrea Bruzzo', // Nome Cliente
      '', // Nome Proprietario
      'Escargo', // Location
      '', // Tipologia Locale
      '', // Nome Referente Agenzia
      '', // Contatto Referente
      '', // Contatto Portineria
      '', // Informazioni Accesso
      '', // Ingresso Stabile
      '', // Chiavi
      '', // Link Google Maps
      '', // Servizi e Dettagli
      '', // Kit di Benvenuto
      '', // Presenza Parcheggio
      '', // Note Speciali
      '', // Tempistiche
      '', // Lavatrice
      '', // Lavastoviglie
      '', // Letti Matrimoniali
      '', // Letti Singoli
      '', // Letti Inglese/Italiana
      '', // Bagni
    ];

    await appendSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z', [newProperty]);

    console.log('✅ Propiedad "Escargo" creada exitosamente!');
    console.log(`\n📊 Detalles:`);
    console.log(`   - ID Propiedad: ${nextPropertyId}`);
    console.log(`   - Cliente: Andrea Bruzzo (ID: ${clientId})`);
    console.log(`   - Location: Escargo`);
  } catch (error) {
    console.error('❌ Error al crear la propiedad:', error);
    throw error;
  }
}

addEscargoProperty();
