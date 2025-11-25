import { updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function createEmployees() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('👥 Creando 11 empleados...\n');

    // Crear 11 empleados con números
    const employees: string[][] = [];
    
    // Empleado 1 es el coordinador
    employees.push(['1', 'Coordinador', '', '', '', 'Coordinatore', 'Sì']);
    
    // Empleados 2-11
    for (let i = 2; i <= 11; i++) {
      employees.push([i.toString(), `Empleado ${i}`, '', '', '', 'Operatore', 'Sì']);
    }

    // Escribir en Google Sheets
    await updateSpreadsheetData(config.sheets.resources, 'Risorse!A1', employees);

    console.log('✅ 11 empleados creados:');
    console.log('   1. Coordinador (tú)');
    console.log('   2-11. Empleado 2 a Empleado 11\n');
    console.log('📝 Puedes editar los nombres directamente en Google Sheets:');
    console.log(`   https://docs.google.com/spreadsheets/d/${config.sheets.resources}/edit\n`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

createEmployees();

