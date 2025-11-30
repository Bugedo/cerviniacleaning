import {
  getGoogleSheetsClient,
  updateSpreadsheetData,
  getSpreadsheetData,
} from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';
import XLSX from 'xlsx';

async function migrateFullData() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('📊 Migrando TODOS los datos del Excel a Google Sheets...\n');

    const clientsSheetId = config.sheets.clients;

    // Leer datos del Excel
    console.log('📖 Leyendo datos del Excel...');
    const excelPath = path.join(process.cwd(), 'APT CERVINIA CLEANING.xlsx');
    const workbook = XLSX.readFile(excelPath);

    // Preparar datos de clientes
    const clientsData: string[][] = [];
    const propertiesData: string[][] = [];

    // Headers para clientes
    clientsData.push(['ID', 'Nome Cliente']);

    // Headers completos para propiedades (todos los campos del Excel + Codice Riferimento + Commenti)
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
      'Codice Riferimento', // Código del nombre de la hoja (ej: Q427, T328, M112, B13)
      'Commenti', // Campo adicional que agregamos
    ]);

    const clientsMap = new Map<string, number>();
    let clientIdCounter = 1;
    let propertyIdCounter = 1;

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      // Extraer código referencial del nombre de la hoja (ej: Q427, T328, M112, B13)
      const codeMatch = sheetName.match(/([A-Z]\d+)/);
      const codiceRiferimento = codeMatch ? codeMatch[1] : '';

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
      const infoAccesso = getField("Informazioni per l'Accesso");
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
      const lettiIngleseItaliana = getField("Letti all'inglese/italiana");
      const bagni = getField('Bagni');

      // Solo agregar cliente si tiene datos
      if (cliente && !clientsMap.has(cliente)) {
        clientsMap.set(cliente, clientIdCounter);
        clientsData.push([clientIdCounter.toString(), cliente]);
        clientIdCounter++;
      }

      const clientId = clientsMap.get(cliente) || 0;

      // Agregar propiedad con todos los campos
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
        codiceRiferimento, // Código del nombre de la hoja
        '', // Commenti - inicialmente vacío
      ]);

      propertyIdCounter++;
    });

    // Escribir datos en Google Sheets
    console.log('📝 Escribiendo datos en Google Sheets...\n');

    const sheets = await getGoogleSheetsClient();

    // Actualizar hoja de clientes
    await updateSpreadsheetData(clientsSheetId, 'Clienti!A1', clientsData);
    console.log(`✅ ${clientsData.length - 1} clientes migrados`);

    // Leer propiedades existentes para preservar las que no están en el Excel (como las de Lika)
    const existingPropertiesData = await getSpreadsheetData(clientsSheetId, 'Proprietà!A:AA');
    const existingPropertiesMap = new Map<string, string[]>();

    // Mapear propiedades existentes por ID
    existingPropertiesData.slice(1).forEach((row) => {
      if (row[0]) {
        existingPropertiesMap.set(row[0].toString(), row);
      }
    });

    // Agregar propiedades del Excel que no existen o actualizar las existentes
    propertiesData.slice(1).forEach((newProp) => {
      const propId = newProp[0].toString();
      // Asegurar que tenga todos los campos: 25 campos (hasta Commenti) + Codice Riferimento
      // Orden: ...Bagni (23), Codice Riferimento (24), Commenti (25)
      if (newProp.length < 26) {
        // Si tiene menos de 26, puede que falte Codice Riferimento o Commenti
        while (newProp.length < 24) {
          newProp.push(''); // Llenar hasta Bagni
        }
        if (newProp.length === 24) {
          newProp.push(''); // Agregar Codice Riferimento si falta
        }
        if (newProp.length === 25) {
          newProp.push(''); // Agregar Commenti si falta
        }
      }
      existingPropertiesMap.set(propId, newProp);
    });

    // Convertir el mapa de vuelta a array
    const allPropertiesData = [propertiesData[0]]; // Header
    Array.from(existingPropertiesMap.values()).forEach((prop) => {
      // Asegurar que todas tengan todos los campos (26 campos totales)
      if (prop.length < 26) {
        while (prop.length < 24) {
          prop.push(''); // Llenar hasta Bagni
        }
        if (prop.length === 24) {
          prop.push(''); // Agregar Codice Riferimento si falta
        }
        if (prop.length === 25) {
          prop.push(''); // Agregar Commenti si falta
        }
      }
      allPropertiesData.push(prop);
    });

    // Actualizar hoja de propiedades con todas las propiedades (del Excel + existentes)
    await updateSpreadsheetData(clientsSheetId, 'Proprietà!A1', allPropertiesData);
    console.log(
      `✅ ${allPropertiesData.length - 1} proprietà totali (${propertiesData.length - 1} dal Excel + ${allPropertiesData.length - propertiesData.length} esistenti)\n`,
    );

    console.log('✅ Migración completa finalizada!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - Clientes: ${clientsData.length - 1}`);
    console.log(`   - Propiedades: ${allPropertiesData.length - 1}`);
    console.log(`   - Campos por propiedad: ${allPropertiesData[0].length - 1}`);
    console.log(`   - Códigos referenciales capturados del nombre de las hojas\n`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

migrateFullData();
