import { getGoogleSheetsClient, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';
import XLSX from 'xlsx';

async function migrateData() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('📊 Migrando datos del Excel a Google Sheets...\n');

    const clientsSheetId = config.sheets.clients;

    // Leer datos del Excel
    console.log('📖 Leyendo datos del Excel...');
    const excelPath = path.join(process.cwd(), 'APT CERVINIA CLEANING.xlsx');
    const workbook = XLSX.readFile(excelPath);

    // Preparar datos de clientes
    const clientsData: string[][] = [];
    const propertiesData: string[][] = [];

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

      const getField = (fieldName: string): string => {
        const row = data.find((row: unknown[]) => row[0] && row[0].toString().includes(fieldName));
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

      if (cliente && !clientsMap.has(cliente)) {
        clientsMap.set(cliente, clientIdCounter);
        clientsData.push([clientIdCounter.toString(), cliente]);
        clientIdCounter++;
      }

      const clientId = clientsMap.get(cliente) || 0;

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
    console.log('📝 Escribiendo datos en Google Sheets...\n');

    const sheets = await getGoogleSheetsClient();

    // Crear hoja de clientes si no existe
    try {
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
    } catch {
      // La hoja ya existe, continuar
    }

    await updateSpreadsheetData(clientsSheetId, 'Clienti!A1', clientsData);
    console.log(`✅ ${clientsData.length - 1} clientes migrados`);

    // Crear hoja de propiedades si no existe
    try {
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
    } catch {
      // La hoja ya existe, continuar
    }

    await updateSpreadsheetData(clientsSheetId, 'Proprietà!A1', propertiesData);
    console.log(`✅ ${propertiesData.length - 1} proprietà migrate\n`);

    console.log('✅ Migración completada!');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

migrateData();

