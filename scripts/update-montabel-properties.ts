import { getGoogleSheetsClient, getSpreadsheetData, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function updateMontabelProperties() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🔄 Actualizando propiedades de Montabel para Il Cervino...\n');

    const clientsSheetId = config.sheets.clients;
    const sheets = await getGoogleSheetsClient();

    // Leer todas las propiedades
    const propertiesData = await getSpreadsheetData(clientsSheetId, 'Proprietà!A:AA');
    
    const cervinoClientId = '7'; // ID de Il Cervino
    const propertiesToDelete: string[] = [];

    // Identificar propiedades de Montabel que NO son M112
    propertiesData.slice(1).forEach((row) => {
      const id = row[0]?.toString() || '';
      const clientId = row[1]?.toString() || '';
      const location = row[4]?.toString() || '';
      const referenceCode = row[24]?.toString() || '';
      
      if (clientId === cervinoClientId && 
          location.toLowerCase().includes('montabel')) {
        // Si NO es M112, marcarla para eliminar
        if (referenceCode !== 'M112') {
          propertiesToDelete.push(id);
          console.log(`🗑️  Propiedad a eliminar: ID ${id} - ${location} (Código: ${referenceCode || 'sin código'})`);
        } else {
          console.log(`✅ Propiedad a mantener: ID ${id} - ${location} (Código: ${referenceCode})`);
        }
      }
    });

    if (propertiesToDelete.length === 0) {
      console.log('\n✅ No hay propiedades de Montabel para eliminar. Solo M112 existe.\n');
      return;
    }

    // Filtrar las propiedades a eliminar
    const filteredProperties = [
      propertiesData[0], // Header
      ...propertiesData.slice(1).filter(row => !propertiesToDelete.includes(row[0]?.toString() || ''))
    ];
    
    await updateSpreadsheetData(clientsSheetId, 'Proprietà!A1', filteredProperties);
    
    console.log(`\n✅ ${propertiesToDelete.length} propiedad(es) eliminada(s)`);
    console.log('✅ Actualización completada!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - Propiedades eliminadas: ${propertiesToDelete.length}`);
    console.log(`   - Propiedad mantenida: M112\n`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

updateMontabelProperties();

