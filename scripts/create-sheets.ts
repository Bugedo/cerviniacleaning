import { getGoogleSheetsClient, createSpreadsheet, updateSpreadsheetData } from '../lib/googleSheets';
import XLSX from 'xlsx';
import path from 'path';
import { writeFileSync } from 'fs';

async function createSheets() {
  try {
    // ID de la carpeta compartida en Google Drive
    const FOLDER_ID = '13THeS4AnYGPf3RkLzFvDC-uWmPK6rai3';

    console.log('📊 Creando Google Sheets en la carpeta compartida...\n');
    console.log(`📁 Carpeta: ${FOLDER_ID}\n`);

    // 1. Crear Google Sheet para Clientes
    console.log('1. Creando Google Sheet para Clientes...');
    const clientsSheetId = await createSpreadsheet('Cervinia Cleaning - Clienti', FOLDER_ID);
    console.log(`   ✅ Clientes Sheet ID: ${clientsSheetId}`);

    // 2. Crear Google Sheet para Calendario
    console.log('2. Creando Google Sheet para Calendario...');
    const calendarSheetId = await createSpreadsheet('Cervinia Cleaning - Calendario', FOLDER_ID);
    console.log(`   ✅ Calendario Sheet ID: ${calendarSheetId}`);

    // 3. Crear Google Sheet para Risorse
    console.log('3. Creando Google Sheet para Risorse...');
    const resourcesSheetId = await createSpreadsheet('Cervinia Cleaning - Risorse', FOLDER_ID);
    console.log(`   ✅ Risorse Sheet ID: ${resourcesSheetId}`);

    // 4. Crear Google Sheet para Fatturazione
    console.log('4. Creando Google Sheet para Fatturazione...');
    const billingSheetId = await createSpreadsheet('Cervinia Cleaning - Fatturazione', FOLDER_ID);
    console.log(`   ✅ Fatturazione Sheet ID: ${billingSheetId}\n`);

    // Leer datos del Excel
    console.log('📖 Leyendo datos del Excel...');
    const filePath = path.join(process.cwd(), 'APT CERVINIA CLEANING.xlsx');
    const workbook = XLSX.readFile(filePath);

    // Migrar datos de clientes
    console.log('📝 Migrando datos de clientes...');
    const clientsData: any[][] = [];
    const propertiesData: any[][] = [];

    // Headers para clientes
    clientsData.push(['ID', 'Nome Cliente']);
    propertiesData.push([
      'ID',
      'ID Cliente',
      'Nome Cliente',
      'Nome Proprietario',
      'Location',
      'Tipologia Locale',
      'Nome Referente Agenzia',
      'Contatto Referente',
      'Contatto Portineria',
      'Informazioni Accesso',
      'Ingresso Stabile',
      'Chiavi',
      'Link Google Maps',
      'Servizi e Dettagli',
      'Kit di Benvenuto',
      'Presenza Parcheggio',
      'Note Speciali',
      'Tempistiche',
      'Lavatrice',
      'Lavastoviglie',
      'Letti Matrimoniali',
      'Letti Singoli',
      'Letti Inglese/Italiana',
      'Bagni',
    ]);

    const clientsMap = new Map<string, number>();
    let clientIdCounter = 1;
    let propertyIdCounter = 1;

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      // Extraer datos de la propiedad
      const getField = (fieldName: string): string => {
        const row = data.find((row: any) => row[0] && row[0].toString().includes(fieldName));
        return row ? (row[1] || '').toString() : '';
      };

      const cliente = getField('CLIENTE');
      const location = getField('LOCATION');
      const tipologia = getField('TIPOLOGIA LOCALE');
      const nomeProprietario = getField('Nome Proprietario');
      const nomeReferente = getField('Nome referente agenzia');
      const contattoReferente = getField('Contatto referente');
      const contattoPortineria = getField('Contatto portineria');
      const infoAccesso = getField('Informazioni per l\'Accesso');
      const ingressoStabile = getField('Ingresso stabile');
      const chiavi = getField('Chiavi');
      const linkMaps = getField('Link a Google Maps');
      const servizi = getField('Servizi e Dettagli');
      const kitBenvenuto = getField('Kit di Benvenuto');
      const parcheggio = getField('Presenza Parcheggio');
      const noteSpeciali = getField('Note Speciali');
      const tempistiche = getField('Tempistiche');
      const lavatrice = getField('Lavatrice');
      const lavastoviglie = getField('Lavastoviglie');
      const lettiMatrimoniali = getField('Letti matrimoniali');
      const lettiSingoli = getField('Letti singoli');
      const lettiIngleseItaliana = getField('Letti all\'inglese/italiana');
      const bagni = getField('Bagni');

      // Agregar cliente si no existe
      if (cliente && !clientsMap.has(cliente)) {
        clientsMap.set(cliente, clientIdCounter);
        clientsData.push([clientIdCounter.toString(), cliente]);
        clientIdCounter++;
      }

      const clientId = clientsMap.get(cliente) || 0;

      // Agregar propiedad
      propertiesData.push([
        propertyIdCounter.toString(),
        clientId.toString(),
        cliente,
        nomeProprietario,
        location,
        tipologia,
        nomeReferente,
        contattoReferente,
        contattoPortineria,
        infoAccesso,
        ingressoStabile,
        chiavi,
        linkMaps,
        servizi,
        kitBenvenuto,
        parcheggio,
        noteSpeciali,
        tempistiche,
        lavatrice,
        lavastoviglie,
        lettiMatrimoniali.toString(),
        lettiSingoli.toString(),
        lettiIngleseItaliana,
        bagni.toString(),
      ]);

      propertyIdCounter++;
    });

    // Escribir datos en Google Sheets
    const sheets = await getGoogleSheetsClient();

    // Crear hoja de clientes
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: clientsSheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: 'Clienti' },
            },
          },
        ],
      },
    });

    await updateSpreadsheetData(clientsSheetId, 'Clienti!A1', clientsData);

    // Crear hoja de propiedades
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: clientsSheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: 'Proprietà' },
            },
          },
        ],
      },
    });

    await updateSpreadsheetData(clientsSheetId, 'Proprietà!A1', propertiesData);

    console.log(`   ✅ ${clientsData.length - 1} clientes migrados`);
    console.log(`   ✅ ${propertiesData.length - 1} proprietà migrate\n`);

    // Crear estructura para Calendario
    const calendarHeaders = [
      'Data',
      'Giorno',
      'ID Proprietà',
      'Nome Proprietà',
      'Cliente',
      'ID Risorsa 1',
      'Nome Risorsa 1',
      'ID Risorsa 2',
      'Nome Risorsa 2',
      'Ora Inizio',
      'Ora Fine',
      'Stato',
      'Note',
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: calendarSheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: 'Calendario' },
            },
          },
        ],
      },
    });

    await updateSpreadsheetData(calendarSheetId, 'Calendario!A1', [calendarHeaders]);

    // Crear estructura para Risorse
    const resourcesHeaders = [
      'ID',
      'Nome',
      'Cognome',
      'Email',
      'Telefono',
      'Ruolo',
      'Attivo',
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: resourcesSheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: 'Risorse' },
            },
          },
        ],
      },
    });

    await updateSpreadsheetData(resourcesSheetId, 'Risorse!A1', [resourcesHeaders]);

    // Crear estructura para Fatturazione
    const billingHeaders = [
      'ID',
      'Data',
      'Cliente',
      'Proprietà',
      'Importo',
      'Stato',
      'Note',
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: billingSheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: 'Fatturazione' },
            },
          },
        ],
      },
    });

    await updateSpreadsheetData(billingSheetId, 'Fatturazione!A1', [billingHeaders]);

    console.log('✅ Todos los Google Sheets creados y estructurados!\n');
    console.log('📋 IDs de los Sheets:');
    console.log(`   Clientes: ${clientsSheetId}`);
    console.log(`   Calendario: ${calendarSheetId}`);
    console.log(`   Risorse: ${resourcesSheetId}`);
    console.log(`   Fatturazione: ${billingSheetId}\n`);

    // Guardar IDs en un archivo de configuración
    const config = {
      sheets: {
        clients: clientsSheetId,
        calendar: calendarSheetId,
        resources: resourcesSheetId,
        billing: billingSheetId,
      },
    };

    writeFileSync(
      path.join(process.cwd(), 'sheets-config.json'),
      JSON.stringify(config, null, 2)
    );

    console.log('✅ Configuración guardada en sheets-config.json');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createSheets();

