import { getGoogleSheetsClient, getSpreadsheetData, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function updateEmployeeNames() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('👥 Actualizando nombres de empleados...\n');

    const resourcesSheetId = config.sheets.resources;
    const resourcesData = await getSpreadsheetData(resourcesSheetId, 'Risorse!A:G');

    // Nombres de empleados
    const employeeNames: Record<string, string> = {
      '1': 'Nicolas Bugedo',
      '2': 'Gabriel Gioria',
      '3': 'Ayelen Baronetto',
      '4': 'Joaquin Sanchez',
      '5': 'Ximena Diaz',
      '6': 'Lucas Galdini',
      '7': 'Lucia Sabik',
      '8': 'Bianca Nichele',
      '9': 'Bautista Solda',
      '10': 'Empleado 10', // Mujer italiana - nombre pendiente
      '11': 'Empleado 11', // Mujer nigeriana - nombre pendiente
    };

    // Actualizar nombres
    const updatedResourcesData = resourcesData.map((row) => {
      const id = row[0]?.toString() || '';
      if (employeeNames[id]) {
        const newRow = [...row];
        newRow[1] = employeeNames[id]; // Columna B es el nombre
        return newRow;
      }
      return row;
    });

    await updateSpreadsheetData(resourcesSheetId, 'Risorse!A1', updatedResourcesData);

    console.log('✅ Nombres actualizados:\n');
    Object.entries(employeeNames).forEach(([id, name]) => {
      const role = id === '1' ? 'Coordinatore' : 'Operatore';
      console.log(`   ID ${id}: ${name} (${role})`);
    });
    
    console.log('\n📝 Nota: Empleado 10 y 11 tienen nombres pendientes\n');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

updateEmployeeNames();

