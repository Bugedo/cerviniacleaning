import { getSpreadsheetData } from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

async function verifyAB13Properties() {
  try {
    const config = getSheetsConfig();

    console.log('🔍 Verificando propiedades de Andrea Bruzzo...\n');

    // Leer clientes
    const clientsData = await getSpreadsheetData(config.sheets.clients, 'Clienti!A:Z');
    const clientsRows = clientsData.slice(1);

    const andreaBruzzo = clientsRows.find((row) => row[1] === 'Andrea Bruzzo');
    if (!andreaBruzzo) {
      console.log('❌ No se encontró el cliente "Andrea Bruzzo"');
      return;
    }

    const clientId = andreaBruzzo[0];
    console.log(`✅ Cliente encontrado: "Andrea Bruzzo" (ID: ${clientId})\n`);

    // Leer propiedades
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z');
    const propertiesRows = propertiesData.slice(1);

    console.log('🏠 Propiedades de Andrea Bruzzo:\n');
    const properties = propertiesRows
      .map((row, index) => ({
        rowIndex: index + 2,
        id: row[0] || '',
        clientId: row[1] || '',
        clientName: row[2] || '',
        location: row[4] || '',
      }))
      .filter((prop) => prop.clientId === clientId);

    properties.forEach((prop) => {
      console.log(`   [${prop.id}] "${prop.location}" (fila ${prop.rowIndex})`);
    });

    console.log(`\n📊 Total: ${properties.length} propiedades\n`);

    // Verificar si falta Escargo
    const hasEscargo = properties.some((p) => p.location.toLowerCase().includes('escargo'));
    if (!hasEscargo) {
      console.log('⚠️  No se encontró la propiedad "Escargo"');
      console.log('   ¿Quieres que la cree?');
    } else {
      console.log('✅ Propiedad "Escargo" encontrada');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

verifyAB13Properties();
