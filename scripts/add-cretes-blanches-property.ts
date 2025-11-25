import { getGoogleSheetsClient, getSpreadsheetData, appendSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function addCretesBlanchesProperty() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('➕ Agregando propiedad Cretes Blanches Q403 a Il Cervino...\n');

    const clientsSheetId = config.sheets.clients;
    
    // Leer propiedades existentes para obtener el próximo ID
    const propertiesData = await getSpreadsheetData(clientsSheetId, 'Proprietà!A:AA');
    const maxId = Math.max(...propertiesData.slice(1).map(row => parseInt(row[0]?.toString() || '0')));
    const nextPropertyId = (maxId + 1).toString();

    // Leer una propiedad de Il Cervino como referencia para los campos comunes
    const cervinoProperty = propertiesData.slice(1).find(row => row[1]?.toString() === '7');
    
    // Crear nueva propiedad basada en la estructura de Il Cervino
    const newProperty = [
      nextPropertyId,
      '7', // ID Cliente (Il Cervino)
      'Il Cervino', // Nome Cliente
      '', // Nome Proprietario
      'Cretes Blanches - Scala A Apt 19', // Location
      'Appartamento', // Tipologia Locale
      'Marco e/o Francesca', // Nome Referente Agenzia
      '0039 3405658263  Marco', // Contatto Referente
      '0039 3286621337  Francesca', // Contatto Portineria
      'Chiedere orari in/out Agenzia. Scala A, appartamento 19, 1° piano con ascensore.', // Informazioni Accesso
      'con chiavi', // Ingresso Stabile
      'Presenti e indicizzate in magazzino', // Chiavi
      'Link maps', // Link Google Maps
      'Kit biancheria fornito da Agenzia (non ci sono backup)', // Servizi e Dettagli
      'Fornito da Agenzia', // Kit di Benvenuto
      'Posto per carico scarico ricavabile davanti al portone. Parcheggio a 100 mt', // Presenza Parcheggio
      'Cretes Blanches - Scala A, Apt 19, 1° piano. Molti suppellettili e divani. Necessari prodotti per legno.', // Note Speciali
      'Dalle 2 alle 4 ore con 2 risorse.', // Tempistiche
      'si', // Lavatrice
      'si', // Lavastoviglie
      '2', // Letti Matrimoniali
      '4', // Letti Singoli
      'inglese', // Letti Inglese/Italiana
      '3', // Bagni
      'Q403', // Codice Riferimento
      '', // Commenti
    ];

    await appendSpreadsheetData(clientsSheetId, 'Proprietà!A:AA', [newProperty]);

    console.log('✅ Propiedad agregada:');
    console.log(`   - ID: ${nextPropertyId}`);
    console.log(`   - Location: Cretes Blanches - Scala A Apt 19`);
    console.log(`   - Cliente: Il Cervino`);
    console.log(`   - Código: Q403`);
    console.log(`   - Accesso: Scala A, appartamento 19, 1° piano con ascensore\n`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

addCretesBlanchesProperty();

