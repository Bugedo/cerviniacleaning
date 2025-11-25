import { getSpreadsheetData, appendSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function addClientLika() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('👤 Agregando cliente Lika y sus propiedades...\n');

    // Obtener el próximo ID de cliente
    const clientsData = await getSpreadsheetData(config.sheets.clients, 'Clienti!A:B');
    const nextClientId = (clientsData.length).toString(); // Ya incluye el header

    // Obtener el próximo ID de propiedad
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:A');
    let nextPropertyId = propertiesData.length; // Ya incluye el header

    // Agregar cliente Lika
    const newClient = [nextClientId, 'Lika'];
    await appendSpreadsheetData(config.sheets.clients, 'Clienti!A:B', [newClient]);
    console.log(`✅ Cliente agregado: ID ${nextClientId} - Lika\n`);

    // Crear propiedades mock
    // 4 chalets, pero el chalet 3 está subdividido en 3 (3A, 3B, 3C)
    // Total: 6 propiedades (Chalet 1, Chalet 2, Chalet 3A, Chalet 3B, Chalet 3C, Chalet 4)

    const properties = [
      // Chalet 1
      [
        (nextPropertyId++).toString(),
        nextClientId,
        'Lika',
        'Lika', // Nome Proprietario
        'Chalet 1', // Location - se actualizará con el nombre real
        'Chalet', // Tipologia Locale
        'Lika', // Nome Referente Agenzia
        '0039 XXX XXX XXXX Lika', // Contatto Referente - mock
        '', // Contatto Portineria
        'Da definire', // Informazioni Accesso
        'Da definire', // Ingresso Stabile
        'Da definire', // Chiavi
        'Link maps', // Link Google Maps
        'Pulizia completa chalet', // Servizi e Dettagli
        'Da definire', // Kit di Benvenuto
        'Da definire', // Presenza Parcheggio
        'Chalet 1 - Lika', // Note Speciali
        'Da definire', // Tempistiche
        'si', // Lavatrice
        'si', // Lavastoviglie
        '2', // Letti Matrimoniali
        '2', // Letti Singoli
        'italiana', // Letti Inglese/Italiana
        '2', // Bagni
      ],
      // Chalet 2
      [
        (nextPropertyId++).toString(),
        nextClientId,
        'Lika',
        'Lika',
        'Chalet 2', // Location - se actualizará
        'Chalet',
        'Lika',
        '0039 XXX XXX XXXX Lika',
        '',
        'Da definire',
        'Da definire',
        'Da definire',
        'Link maps',
        'Pulizia completa chalet',
        'Da definire',
        'Da definire',
        'Chalet 2 - Lika',
        'Da definire',
        'si',
        'si',
        '2',
        '2',
        'italiana',
        '2',
      ],
      // Chalet 3A (subdivisión del Chalet 3)
      [
        (nextPropertyId++).toString(),
        nextClientId,
        'Lika',
        'Lika',
        'Chalet 3A', // Location - se actualizará
        'Appartamento',
        'Lika',
        '0039 XXX XXX XXXX Lika',
        '',
        'Da definire',
        'Da definire',
        'Da definire',
        'Link maps',
        'Pulizia completa appartamento',
        'Da definire',
        'Da definire',
        'Chalet 3 - Subdivisione A - Lika',
        'Da definire',
        'si',
        'si',
        '1',
        '1',
        'italiana',
        '1',
      ],
      // Chalet 3B
      [
        (nextPropertyId++).toString(),
        nextClientId,
        'Lika',
        'Lika',
        'Chalet 3B', // Location - se actualizará
        'Appartamento',
        'Lika',
        '0039 XXX XXX XXXX Lika',
        '',
        'Da definire',
        'Da definire',
        'Da definire',
        'Link maps',
        'Pulizia completa appartamento',
        'Da definire',
        'Da definire',
        'Chalet 3 - Subdivisione B - Lika',
        'Da definire',
        'si',
        'si',
        '1',
        '1',
        'italiana',
        '1',
      ],
      // Chalet 3C
      [
        (nextPropertyId++).toString(),
        nextClientId,
        'Lika',
        'Lika',
        'Chalet 3C', // Location - se actualizará
        'Appartamento',
        'Lika',
        '0039 XXX XXX XXXX Lika',
        '',
        'Da definire',
        'Da definire',
        'Da definire',
        'Link maps',
        'Pulizia completa appartamento',
        'Da definire',
        'Da definire',
        'Chalet 3 - Subdivisione C - Lika',
        'Da definire',
        'si',
        'si',
        '1',
        '1',
        'italiana',
        '1',
      ],
      // Chalet 4
      [
        (nextPropertyId++).toString(),
        nextClientId,
        'Lika',
        'Lika',
        'Chalet 4', // Location - se actualizará
        'Chalet',
        'Lika',
        '0039 XXX XXX XXXX Lika',
        '',
        'Da definire',
        'Da definire',
        'Da definire',
        'Link maps',
        'Pulizia completa chalet',
        'Da definire',
        'Da definire',
        'Chalet 4 - Lika',
        'Da definire',
        'si',
        'si',
        '2',
        '2',
        'italiana',
        '2',
      ],
    ];

    // Agregar todas las propiedades
    await appendSpreadsheetData(config.sheets.clients, 'Proprietà!A:Y', properties);

    console.log('✅ Propiedades agregadas:');
    console.log('   1. Chalet 1');
    console.log('   2. Chalet 2');
    console.log('   3. Chalet 3A (subdivisión)');
    console.log('   4. Chalet 3B (subdivisión)');
    console.log('   5. Chalet 3C (subdivisión)');
    console.log('   6. Chalet 4\n');
    console.log('📝 Total: 1 cliente + 6 proprietà\n');
    console.log('💡 Puedes editar los nombres de las propiedades en Google Sheets:');
    console.log(`   https://docs.google.com/spreadsheets/d/${config.sheets.clients}/edit\n`);
    console.log('   Busca las propiedades con Location "Chalet 1", "Chalet 2", etc.');
    console.log('   y actualiza los nombres reales cuando los tengas.\n');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

addClientLika();

