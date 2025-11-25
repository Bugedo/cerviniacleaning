import { getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function verifyGuffo() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Y');
    const rows = propertiesData.slice(1);

    const guffo = rows.find((row) => row[4] === 'IL GUFFO' && row[2] === 'Lika');

    if (guffo) {
      console.log('✅ IL GUFFO encontrado:\n');
      console.log(`   Location: ${guffo[4]}`);
      console.log(`   Servizi: ${guffo[13]}`);
      console.log(`   Note Speciali: ${guffo[16]}`);
      console.log(`   Tempistiche: ${guffo[17]}\n`);
    } else {
      console.log('❌ No se encontró IL GUFFO');
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
  }
}

verifyGuffo();

