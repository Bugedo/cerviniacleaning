import { getGoogleSheetsClient, getSpreadsheetData, appendSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Ejemplo de cómo agregar un trabajo al calendario desde código
 */
async function addJobExample() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    // Leer trabajos existentes para obtener el próximo ID
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:A');
    const nextId = (calendarData.length).toString();

    // Ejemplo 1: Agregar un trabajo normal
    const jobDate = '2024-01-15'; // YYYY-MM-DD
    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const date = new Date(jobDate);
    const dayName = dayNames[date.getDay()];

    const newJob = [
      nextId,
      jobDate,
      dayName,
      '09:00', // Ora Inizio
      '12:00', // Ora Fine
      'Lavoro', // Tipo: "Lavoro" o "Supervisione"
      'Profonda', // Tipo di Pulizia: "Profonda" o "Repasso" (solo para Lavoro)
      '1', // ID Proprietà
      'Flora Alpina', // Nome Proprietà
      'Agenzia Engel & Volkers', // Cliente
      '2', // ID Risorsa 1
      'Empleado 2', // Nome Risorsa 1
      '3', // ID Risorsa 2
      'Empleado 3', // Nome Risorsa 2
      '4', // ID Risorsa 3 (opcional)
      'Empleado 4', // Nome Risorsa 3
      '5', // ID Risorsa 4 (opcional)
      'Empleado 5', // Nome Risorsa 4
      '6', // ID Risorsa 5 (opcional)
      'Empleado 6', // Nome Risorsa 5
      '', // ID Risorsa 6 (opcional)
      '', // Nome Risorsa 6
      '', // ID Coordinatore (solo para tipo "Supervisione")
      '3.0', // Ore Lavorate (calcular: diferencia entre inicio y fin)
      'Pianificato', // Stato: "Pianificato", "In Corso", "Completato"
      'Nota opzionale', // Note
    ];

    await appendSpreadsheetData(config.sheets.calendar, 'Calendario!A:Z', [newJob]);
    console.log('✅ Trabajo agregado:', newJob[8]); // Nome Proprietà

    // Ejemplo 2: Agregar horas de supervisión del coordinador
    const supervisionDate = '2024-01-15';
    const supervisionDayName = dayNames[new Date(supervisionDate).getDay()];
    const nextId2 = (calendarData.length + 1).toString();

    const supervision = [
      nextId2,
      supervisionDate,
      supervisionDayName,
      '08:00',
      '18:00',
      'Supervisione', // Tipo: Supervisione
      '', // Tipo di Pulizia (vacío para supervisión)
      '', // No hay propiedad para supervisión
      'Supervisione giornaliera', // Descripción
      '', // No hay cliente
      '', // No hay Risorsa 1
      '',
      '', // No hay Risorsa 2
      '',
      '', // No hay Risorsa 3
      '',
      '', // No hay Risorsa 4
      '',
      '', // No hay Risorsa 5
      '',
      '', // No hay Risorsa 6
      '',
      '1', // ID Coordinatore (tú)
      '10.0', // Ore Lavorate
      'Completato',
      'Supervisione di tutti i lavori del giorno',
    ];

    await appendSpreadsheetData(config.sheets.calendar, 'Calendario!A:Z', [supervision]);
    console.log('✅ Horas de supervisión agregadas');

    console.log('\n📝 Estructura de un trabajo:');
    console.log('   - ID: Identificador único');
    console.log('   - Data: YYYY-MM-DD');
    console.log('   - Giorno: Nombre del día');
    console.log('   - Ora Inizio/Fine: HH:MM');
    console.log('   - Tipo: "Lavoro" o "Supervisione"');
    console.log('   - Tipo di Pulizia: "Profonda" o "Repasso" (solo para Lavoro)');
    console.log('   - ID Proprietà: ID de la propiedad (vacío para supervisión)');
    console.log('   - ID Risorsa 1-6: IDs de empleados (hasta 6 empleados)');
    console.log('   - ID Coordinatore: Solo para tipo "Supervisione"');
    console.log('   - Ore Lavorate: Horas totales');
    console.log('   - Stato: "Pianificato", "In Corso", "Completato"');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
  }
}

// Descomentar para ejecutar el ejemplo
// addJobExample();

