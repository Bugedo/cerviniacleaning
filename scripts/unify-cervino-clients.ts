import { getSpreadsheetData, updateSpreadsheetData, getGoogleSheetsClient } from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

async function unifyCervinoClients() {
  try {
    const config = getSheetsConfig();

    console.log('🔄 Unificando referencias de "Il Cervino" a "Agenzia Cervino"...\n');

    // Leer clientes
    const clientsData = await getSpreadsheetData(config.sheets.clients, 'Clienti!A:Z');
    const clientsRows = clientsData.slice(1);

    // Buscar "Agenzia Cervino"
    let agenziaCervinoClient: { id: string; name: string } | null = null;

    clientsRows.forEach((row) => {
      const id = row[0] || '';
      const name = row[1] || '';
      
      if (name.toLowerCase().includes('agenzia cervino')) {
        agenziaCervinoClient = { id, name };
      }
    });

    if (!agenziaCervinoClient) {
      console.log('❌ No se encontró el cliente "Agenzia Cervino"');
      return;
    }

    console.log(`📌 Cliente a usar: "${agenziaCervinoClient.name}" (ID: ${agenziaCervinoClient.id})\n`);

    const sheets = await getGoogleSheetsClient();

    // 1. Actualizar todas las propiedades que tienen "Il Cervino"
    console.log('📝 Actualizando propiedades...');
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z');
    const propertiesRows = propertiesData.slice(1);
    const propertiesToUpdate: Array<{ rowIndex: number }> = [];

    propertiesRows.forEach((row, index) => {
      const propertyClientName = row[2] || ''; // Nome Cliente está en columna C
      if (propertyClientName.toLowerCase().includes('il cervino') && 
          !propertyClientName.toLowerCase().includes('agenzia')) {
        propertiesToUpdate.push({ rowIndex: index + 2 }); // +2 porque empieza en 1 y hay header
      }
    });

    if (propertiesToUpdate.length > 0) {
      console.log(`   Encontradas ${propertiesToUpdate.length} propiedades para actualizar`);
      for (const { rowIndex } of propertiesToUpdate) {
        // Actualizar ID Cliente (columna B) y Nome Cliente (columna C)
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: config.sheets.clients,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: [
              {
                range: `Proprietà!B${rowIndex}`,
                values: [[agenziaCervinoClient.id]],
              },
              {
                range: `Proprietà!C${rowIndex}`,
                values: [[agenziaCervinoClient.name]],
              },
            ],
          },
        });
      }
      console.log(`   ✅ ${propertiesToUpdate.length} propiedades actualizadas\n`);
    } else {
      console.log('   ℹ️  No se encontraron propiedades para actualizar\n');
    }

    // 2. Actualizar todos los eventos que tienen "Il Cervino"
    console.log('📅 Actualizando eventos...');
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:AG');
    const calendarRows = calendarData.slice(1);
    const eventsToUpdate: Array<{ rowIndex: number }> = [];

    calendarRows.forEach((row, index) => {
      const eventClientName = row[9] || ''; // Nombre Cliente está en columna J (índice 9)
      
      if (eventClientName.toLowerCase().includes('il cervino') && 
          !eventClientName.toLowerCase().includes('agenzia')) {
        eventsToUpdate.push({ rowIndex: index + 2 }); // +2 porque empieza en 1 y hay header
      }
    });

    if (eventsToUpdate.length > 0) {
      console.log(`   Encontrados ${eventsToUpdate.length} eventos para actualizar`);
      for (const { rowIndex } of eventsToUpdate) {
        // Actualizar nombre del cliente (columna J) e ID del cliente (columna K)
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: config.sheets.calendar,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: [
              {
                range: `Calendario!J${rowIndex}`,
                values: [[agenziaCervinoClient.name]],
              },
              {
                range: `Calendario!K${rowIndex}`,
                values: [[agenziaCervinoClient.id]],
              },
            ],
          },
        });
      }
      console.log(`   ✅ ${eventsToUpdate.length} eventos actualizados\n`);
    } else {
      console.log('   ℹ️  No se encontraron eventos para actualizar\n');
    }

    console.log('✅ Unificación completada exitosamente!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - Cliente unificado: "${agenziaCervinoClient.name}" (ID: ${agenziaCervinoClient.id})`);
    console.log(`   - Propiedades actualizadas: ${propertiesToUpdate.length}`);
    console.log(`   - Eventos actualizados: ${eventsToUpdate.length}`);
  } catch (error) {
    console.error('❌ Error en la unificación:', error);
    throw error;
  }
}

unifyCervinoClients();

