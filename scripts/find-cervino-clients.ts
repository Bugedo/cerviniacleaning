import { getSpreadsheetData } from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

async function findCervinoClients() {
  try {
    const config = getSheetsConfig();

    console.log('🔍 Buscando clientes relacionados con "Cervino"...\n');

    // Leer clientes
    const clientsData = await getSpreadsheetData(config.sheets.clients, 'Clienti!A:Z');
    const clientsRows = clientsData.slice(1);

    console.log('📋 Todos los clientes encontrados:\n');
    clientsRows.forEach((row, index) => {
      const id = row[0] || '';
      const name = row[1] || '';
      if (name.toLowerCase().includes('cervino')) {
        console.log(`   ⭐ [${id}] ${name} (fila ${index + 2})`);
      } else {
        console.log(`   [${id}] ${name}`);
      }
    });

    // Buscar específicamente
    const cervinoClients = clientsRows
      .map((row, index) => ({
        id: row[0] || '',
        name: row[1] || '',
        index: index + 2, // +2 porque empieza en 1 y hay header
      }))
      .filter(client => client.name.toLowerCase().includes('cervino'));

    console.log(`\n📊 Clientes con "Cervino" encontrados: ${cervinoClients.length}`);
    cervinoClients.forEach(client => {
      console.log(`   - ID: ${client.id}, Nombre: "${client.name}"`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

findCervinoClients();

