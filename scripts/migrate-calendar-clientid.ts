import {
  getSpreadsheetData,
  updateSpreadsheetData,
  getGoogleSheetsClient,
} from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

async function migrateCalendarClientId() {
  try {
    const config = getSheetsConfig();
    const calendarSheetId = config.sheets.calendar;

    console.log('🔄 Migrando eventos para agregar clientId...\n');

    // Leer calendario actual
    const calendarData = await getSpreadsheetData(calendarSheetId, 'Calendario!A:AG');
    const header = calendarData[0];
    const rows = calendarData.slice(1);

    // Leer clientes y propiedades
    const clientsData = await getSpreadsheetData(config.sheets.clients, 'Clienti!A:Z');
    const clientsRows = clientsData.slice(1);
    const clientsMap = new Map<string, string>();
    clientsRows.forEach((row) => {
      if (row[0] && row[1]) {
        clientsMap.set(row[1], row[0]); // nombre -> id
      }
    });

    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z');
    const propertiesRows = propertiesData.slice(1);
    const propertiesMap = new Map<string, string>();
    propertiesRows.forEach((row) => {
      if (row[0] && row[1]) {
        propertiesMap.set(row[0], row[1]); // propertyId -> clientId
      }
    });

    console.log(`📊 Encontrados ${rows.length} eventos para migrar\n`);

    const sheets = await getGoogleSheetsClient();
    let updatedCount = 0;

    // Verificar si ya existe la columna clientId (columna K, índice 10)
    const hasClientIdColumn = header.length > 10;

    // Si no existe, agregar header
    if (!hasClientIdColumn) {
      const newHeader = [...header];
      // Insertar 'ID Cliente' después de 'Cliente' (columna J, índice 9)
      newHeader.splice(10, 0, 'ID Cliente');
      await updateSpreadsheetData(calendarSheetId, 'Calendario!A1', [newHeader]);
      console.log('✅ Header actualizado con columna ID Cliente\n');
    }

    // Actualizar cada fila
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const jobId = row[0];
      const clientName = row[9] || ''; // Nombre del cliente
      const propertyId = row[7] || ''; // ID de la propiedad

      let clientId = '';

      // Intentar obtener clientId de la propiedad primero
      if (propertyId) {
        clientId = propertiesMap.get(propertyId) || '';
      }

      // Si no se encontró, buscar por nombre del cliente
      if (!clientId && clientName) {
        clientId = clientsMap.get(clientName) || '';
      }

      // Si la fila no tiene clientId o es diferente, actualizar
      const currentClientId = row[10] || '';
      if (clientId && currentClientId !== clientId) {
        const rowIndex = i + 2; // +2 porque empieza en 1 y hay header
        const range = `Calendario!K${rowIndex}`;

        await sheets.spreadsheets.values.update({
          spreadsheetId: calendarSheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[clientId]],
          },
        });

        updatedCount++;
        console.log(`✅ Evento ${jobId}: clientId actualizado a ${clientId}`);
      }
    }

    console.log(`\n✅ Migración completada: ${updatedCount} eventos actualizados`);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  }
}

migrateCalendarClientId();
