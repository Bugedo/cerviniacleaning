import { getSpreadsheetData } from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

async function findCervinoEverywhere() {
  try {
    const config = getSheetsConfig();

    console.log('🔍 Buscando "Cervino" en todas las tablas...\n');

    // Buscar en clientes
    console.log('📋 CLIENTES:');
    const clientsData = await getSpreadsheetData(config.sheets.clients, 'Clienti!A:Z');
    const clientsRows = clientsData.slice(1);
    clientsRows.forEach((row) => {
      const id = row[0] || '';
      const name = row[1] || '';
      if (name.toLowerCase().includes('cervino') || name.toLowerCase().includes('il cervino')) {
        console.log(`   ⭐ [${id}] ${name}`);
      }
    });

    // Buscar en propiedades
    console.log('\n🏠 PROPIEDADES:');
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z');
    const propertiesRows = propertiesData.slice(1);
    propertiesRows.forEach((row, index) => {
      const clientName = row[2] || ''; // Nome Cliente
      const location = row[4] || ''; // Location
      if (
        clientName.toLowerCase().includes('cervino') ||
        clientName.toLowerCase().includes('il cervino') ||
        location.toLowerCase().includes('cervino')
      ) {
        console.log(`   ⭐ Fila ${index + 2}: Cliente="${clientName}", Location="${location}"`);
      }
    });

    // Buscar en eventos
    console.log('\n📅 EVENTOS:');
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:AG');
    const calendarRows = calendarData.slice(1);
    calendarRows.forEach((row, index) => {
      const clientName = row[9] || ''; // Cliente
      const propertyName = row[8] || ''; // Nome Proprietà
      if (
        clientName.toLowerCase().includes('cervino') ||
        clientName.toLowerCase().includes('il cervino') ||
        propertyName.toLowerCase().includes('cervino')
      ) {
        console.log(
          `   ⭐ Fila ${index + 2}: Cliente="${clientName}", Proprietà="${propertyName}"`,
        );
      }
    });

    console.log('\n✅ Búsqueda completada');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

findCervinoEverywhere();
