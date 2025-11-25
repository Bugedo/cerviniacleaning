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
      '1', // ID Proprietà
      'Flora Alpina', // Nome Proprietà
      'Agenzia Engel & Volkers', // Cliente
      '2', // ID Risorsa 1
      'Empleado 2', // Nome Risorsa 1
      '3', // ID Risorsa 2 (opcional, dejar vacío si solo hay 1)
      'Empleado 3', // Nome Risorsa 2
      '', // ID Coordinatore (solo para tipo "Supervisione")
      '3.0', // Ore Lavorate (calcular: diferencia entre inicio y fin)
      'Pianificato', // Stato: "Pianificato", "In Corso", "Completato"
      'Nota opzionale', // Note
    ];

    await appendSpreadsheetData(config.sheets.calendar, 'Calendario!A:Q', [newJob]);
    console.log('✅ Trabajo agregado:', newJob[7]); // Nome Proprietà

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
      '', // No hay propiedad para supervisión
      'Supervisione giornaliera', // Descripción
      '', // No hay cliente
      '', // No hay Risorsa 1
      '',
      '', // No hay Risorsa 2
      '',
      '1', // ID Coordinatore (tú)
      '10.0', // Ore Lavorate
      'Completato',
      'Supervisione di tutti i lavori del giorno',
    ];

    await appendSpreadsheetData(config.sheets.calendar, 'Calendario!A:Q', [supervision]);
    console.log('✅ Horas de supervisión agregadas');

    console.log('\n📝 Estructura de un trabajo:');
    console.log('   - ID: Identificador único');
    console.log('   - Data: YYYY-MM-DD');
    console.log('   - Giorno: Nombre del día');
    console.log('   - Ora Inizio/Fine: HH:MM');
    console.log('   - Tipo: "Lavoro" o "Supervisione"');
    console.log('   - ID Proprietà: ID de la propiedad (vacío para supervisión)');
    console.log('   - ID Risorsa 1/2: IDs de empleados (vacío para supervisión)');
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

