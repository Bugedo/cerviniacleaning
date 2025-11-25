import { getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function checkAllProperties() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🔍 Verificando todas las propiedades del cliente 7 (Il Cervino)...\n');

    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:AA');

    const client7Properties: Array<{ id: string; location: string; referenceCode: string; rowIndex: number }> = [];

    propertiesData.slice(1).forEach((row, index) => {
      const id = row[0]?.toString() || '';
      const clientId = row[1]?.toString() || '';
      const location = row[4]?.toString() || '';
      const referenceCode = row[24]?.toString() || '';
      
      if (clientId === '7') {
        client7Properties.push({ id, location, referenceCode, rowIndex: index + 2 });
      }
    });

    console.log(`📊 Propiedades del cliente 7 (Il Cervino): ${client7Properties.length}\n`);
    client7Properties.forEach((prop) => {
      console.log(`   Fila ${prop.rowIndex}: ID ${prop.id} - ${prop.location} (Código: ${prop.referenceCode || 'sin código'})`);
    });

    // Verificar duplicados por ID
    const idCounts = new Map<string, number>();
    client7Properties.forEach(prop => {
      const count = idCounts.get(prop.id) || 0;
      idCounts.set(prop.id, count + 1);
    });

    const duplicates = Array.from(idCounts.entries()).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log(`\n❌ IDs duplicados en cliente 7:`);
      duplicates.forEach(([id, count]) => {
        console.log(`   ID ${id}: ${count} veces`);
      });
    } else {
      console.log('\n✅ No hay IDs duplicados en cliente 7');
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

checkAllProperties();

