import { NextResponse } from 'next/server';
import { getSpreadsheetData } from '@/lib/googleSheets';
import { getSheetsConfig } from '@/lib/sheetsConfig';
import path from 'path';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Intentar leer configuración de sheets
    let config;
    let useGoogleSheets = false;

    try {
      config = getSheetsConfig();
      useGoogleSheets = true;
    } catch {
      // Si no hay config, usar datos del Excel directamente
      console.log('No se encontró sheets-config, usando datos del Excel...');
    }

    interface Client {
      id: string;
      name: string;
    }

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

    let clients: Client[] = [];
    let properties: Property[] = [];

    if (useGoogleSheets && config) {
      // Usar Google Sheets
      const clientsSheetId = config.sheets.clients;
      const clientsData = await getSpreadsheetData(clientsSheetId, 'Clienti!A:B');
      const propertiesData = await getSpreadsheetData(clientsSheetId, 'Proprietà!A:AA'); // Incluye Codice Riferimento y Commenti

      const clientsRows = clientsData.slice(1);
      const propertiesRows = propertiesData.slice(1);

      clients = clientsRows.map((row) => ({
        id: row[0] || '',
        name: row[1] || '',
      }));

      properties = propertiesRows.map((row) => ({
        id: row[0] || '',
        clientId: row[1] || '',
        clientName: row[2] || '',
        ownerName: row[3] || '',
        location: row[4] || '',
        typology: row[5] || '',
        agencyContact: row[6] || '',
        contact: row[7] || '',
        doormanContact: row[8] || '',
        accessInfo: row[9] || '',
        buildingEntry: row[10] || '',
        keys: row[11] || '',
        mapsLink: row[12] || '',
        services: row[13] || '',
        welcomeKit: row[14] || '',
        parking: row[15] || '',
        specialNotes: row[16] || '',
        timing: row[17] || '',
        washingMachine: row[18] || '',
        dishwasher: row[19] || '',
        doubleBeds: row[20] || '',
        singleBeds: row[21] || '',
        bedType: row[22] || '',
        bathrooms: row[23] || '',
        referenceCode: row[24] || '', // Campo Codice Riferimento
        comments: row[25] || '', // Campo Commenti
      }));
    } else {
      // Leer directamente del Excel (solo como fallback si no hay Google Sheets)
      const excelPath = path.join(process.cwd(), 'APT CERVINIA CLEANING.xlsx');
      let workbook;
      try {
        workbook = XLSX.readFile(excelPath);
      } catch {
        // Si no existe el Excel, retornar vacío
        return NextResponse.json({ clients: [] });
      }

      const clientsMap = new Map<string, number>();
      let clientIdCounter = 1;
      let propertyIdCounter = 1;

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        const getField = (fieldName: string): string => {
          const row = data.find(
            (row: unknown[]) => row[0] && row[0].toString().includes(fieldName),
          );
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

        if (cliente && !clientsMap.has(cliente)) {
          clientsMap.set(cliente, clientIdCounter);
          clients.push({
            id: clientIdCounter.toString(),
            name: cliente,
          });
          clientIdCounter++;
        }

        const clientId = clientsMap.get(cliente) || 0;

        properties.push({
          id: propertyIdCounter.toString(),
          clientId: clientId.toString(),
          clientName: cliente,
          ownerName: nomeProprietario,
          location: location,
          typology: tipologia,
          agencyContact: nomeReferente,
          contact: contattoReferente,
          doormanContact: contattoPortineria,
          accessInfo: infoAccesso,
          buildingEntry: ingressoStabile,
          keys: chiavi,
          mapsLink: linkMaps,
          services: servizi,
          welcomeKit: kitBenvenuto,
          parking: parcheggio,
          specialNotes: noteSpeciali,
          timing: tempistiche,
          washingMachine: lavatrice,
          dishwasher: lavastoviglie,
          doubleBeds: lettiMatrimoniali.toString(),
          singleBeds: lettiSingoli.toString(),
          bedType: lettiIngleseItaliana,
          bathrooms: bagni.toString(),
          referenceCode: '', // Campo Codice Riferimento (se extrae del nombre de la hoja)
          comments: '', // Campo Commenti inicialmente vacío
        });

        propertyIdCounter++;
      });
    }

    // Agrupar propiedades por cliente
    const clientsWithProperties = clients.map((client) => ({
      ...client,
      properties: properties.filter((prop) => prop.clientId === client.id),
    }));

    return NextResponse.json({ clients: clientsWithProperties });
  } catch (error) {
    console.error('Error fetching clients:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener clientes';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
