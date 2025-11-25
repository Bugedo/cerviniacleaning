import { updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function updateCalendarStructure() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('📅 Actualizando estructura del Calendario...\n');

    // Nueva estructura del calendario
    const calendarHeaders = [
      'ID',
      'Data',
      'Giorno',
      'Ora Inizio',
      'Ora Fine',
      'Tipo', // "Lavoro" o "Supervisione"
      'ID Proprietà',
      'Nome Proprietà',
      'Cliente',
      'ID Risorsa 1',
      'Nome Risorsa 1',
      'ID Risorsa 2',
      'Nome Risorsa 2',
      'ID Coordinatore', // Para horas de supervisión
      'Ore Lavorate', // Horas totales del trabajo
      'Stato', // "Pianificato", "In Corso", "Completato"
      'Note',
    ];

    await updateSpreadsheetData(config.sheets.calendar, 'Calendario!A1', [calendarHeaders]);

    console.log('✅ Estructura del Calendario actualizada!');
    console.log('\n📝 Campos disponibles:');
    console.log('   - ID: Identificador único del trabajo');
    console.log('   - Data: Fecha del trabajo (YYYY-MM-DD)');
    console.log('   - Giorno: Día de la semana');
    console.log('   - Ora Inizio/Fine: Horas de inicio y fin');
    console.log('   - Tipo: "Lavoro" (trabajo normal) o "Supervisione" (horas coordinador)');
    console.log('   - ID Proprietà: ID de la propiedad a limpiar');
    console.log('   - ID Risorsa 1/2: IDs de los empleados asignados');
    console.log('   - ID Coordinatore: Para marcar horas de supervisión');
    console.log('   - Ore Lavorate: Horas totales (se calcula automáticamente)');
    console.log('   - Stato: Estado del trabajo\n');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

updateCalendarStructure();

