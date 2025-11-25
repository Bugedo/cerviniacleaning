import { getGoogleSheetsClient, getSpreadsheetData, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function removeDuplicateT335() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🗑️  Eliminando propiedad duplicada T335...\n');

    const clientsSheetId = config.sheets.clients;
    const propertiesData = await getSpreadsheetData(clientsSheetId, 'Proprietà!A:AA');

    // Encontrar las dos propiedades T335
    const t335Properties: Array<{ rowIndex: number; id: string; location: string }> = [];
    
    propertiesData.slice(1).forEach((row, index) => {
      const id = row[0]?.toString() || '';
      const location = row[4]?.toString() || '';
      const referenceCode = row[24]?.toString() || '';
      
      if (location.includes('T335') || referenceCode === 'T335') {
        t335Properties.push({ rowIndex: index + 2, id, location });
      }
    });

    console.log(`📊 Propiedades T335 encontradas: ${t335Properties.length}\n`);
    t335Properties.forEach((prop) => {
      console.log(`   Fila ${prop.rowIndex}: ID ${prop.id} - ${prop.location}`);
    });

    if (t335Properties.length <= 1) {
      console.log('\n✅ No hay duplicados de T335\n');
      return;
    }

    // Eliminar la segunda (ID 23, que es la duplicada que creamos)
    const idToDelete = t335Properties[1].id;
    console.log(`\n🗑️  Eliminando propiedad duplicada: ID ${idToDelete} (Fila ${t335Properties[1].rowIndex})\n`);

    // Filtrar eliminando la fila con el ID a eliminar
    const filteredProperties: string[][] = [propertiesData[0]]; // Header
    
    propertiesData.slice(1).forEach((row) => {
      const rowId = row[0]?.toString() || '';
      if (rowId !== idToDelete) {
        filteredProperties.push(row as string[]);
      } else {
        console.log(`   ✅ Fila eliminada: ID ${rowId} - ${row[4]}`);
      }
    });
    
    console.log(`\n📊 Total de propiedades antes: ${propertiesData.length - 1}`);
    console.log(`📊 Total de propiedades después: ${filteredProperties.length - 1}\n`);
    
    await updateSpreadsheetData(clientsSheetId, 'Proprietà!A1', filteredProperties);
    
    console.log('✅ Propiedad duplicada eliminada!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - Propiedad eliminada: ID ${idToDelete}`);
    console.log(`   - Propiedad mantenida: ID ${t335Properties[0].id} (T335)\n`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

removeDuplicateT335();

