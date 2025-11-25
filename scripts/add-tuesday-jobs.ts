import { getGoogleSheetsClient, getSpreadsheetData, appendSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function addTuesdayJobs() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('📅 Agregando trabajos del martes 25 de noviembre...\n');

    // Obtener el próximo ID
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:A');
    let nextId = calendarData.length;

    const jobDate = '2025-11-25';
    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const date = new Date(jobDate);
    const dayName = dayNames[date.getDay()];

    // Leer nombres de empleados
    const resourcesData = await getSpreadsheetData(config.sheets.resources, 'Risorse!A:G');
    const getEmployeeName = (id: string): string => {
      const employee = resourcesData.find(row => row[0]?.toString() === id);
      return employee ? (employee[1]?.toString() || `Empleado ${id}`) : `Empleado ${id}`;
    };

    // Trabajo 1: Cretes Blanches Scala A Apt 19
    // Joaquin (ID 4) y Lucas (ID 6), 3 horas
    const hoursWorked1 = 3.0;
    const startTime1 = '09:00';
    const endTime1 = '12:00';

    const job1 = [
      (nextId++).toString(),
      jobDate,
      dayName,
      startTime1,
      endTime1,
      'Lavoro',
      'Profonda',
      '23', // ID Proprietà (Cretes Blanches)
      'Cretes Blanches - Scala A Apt 19',
      'Il Cervino',
      '4', // ID Risorsa 1 - Joaquin
      getEmployeeName('4'),
      '6', // ID Risorsa 2 - Lucas
      getEmployeeName('6'),
      '', '', '', '', '', '', '', '', // Risorsa 3-6 vacías
      '', // ID Coordinatore
      hoursWorked1.toString(),
      'Completato',
      'Lavoro completato da Joaquin e Lucas',
    ];

    // Trabajo 2: Piccolo Rododendro
    // Bianca (ID 8) y Bautista (ID 9), 3 horas
    const hoursWorked2 = 3.0;
    const startTime2 = '14:00'; // Después del primer trabajo
    const endTime2 = '17:00';

    const job2 = [
      (nextId++).toString(),
      jobDate,
      dayName,
      startTime2,
      endTime2,
      'Lavoro',
      'Profonda',
      '11', // ID Proprietà (Piccolo Rododendro)
      'Condominio Piccolo Rododendro Q427',
      'Il Cervino',
      '8', // ID Risorsa 1 - Bianca
      getEmployeeName('8'),
      '9', // ID Risorsa 2 - Bautista
      getEmployeeName('9'),
      '', '', '', '', '', '', '', '', // Risorsa 3-6 vacías
      '', // ID Coordinatore
      hoursWorked2.toString(),
      'Completato',
      'Lavoro completato da Bianca e Bautista',
    ];

    // Trabajo 3: Horas manuales de Nicolas (ID 1) - 11 horas
    const hoursNicolas = 11.0;
    const supervision1 = [
      (nextId++).toString(),
      jobDate,
      dayName,
      '08:00',
      '19:00',
      'Supervisione',
      '',
      '',
      'Supervisione giornaliera',
      'Il Cervino',
      '', '', '', '', '', '', '', '', '', '', // Risorsa 1-6 vacías
      '1', // ID Coordinatore - Nicolas
      hoursNicolas.toString(),
      'Completato',
      'Ore lavorate manuali: 11h',
    ];

    // Trabajo 4: Horas manuales de Gabriel (ID 2) - 11 horas
    const hoursGabriel = 11.0;
    const supervision2 = [
      (nextId++).toString(),
      jobDate,
      dayName,
      '08:00',
      '19:00',
      'Supervisione',
      '',
      '',
      'Supervisione giornaliera',
      'Il Cervino',
      '', '', '', '', '', '', '', '', '', '', // Risorsa 1-6 vacías
      '2', // ID Coordinatore - Gabriel
      hoursGabriel.toString(),
      'Completato',
      'Ore lavorate manuali: 11h',
    ];

    await appendSpreadsheetData(config.sheets.calendar, 'Calendario!A:Z', [job1, job2, supervision1, supervision2]);
    
    console.log('✅ Trabajos agregados:');
    console.log(`\n1. Cretes Blanches Scala A Apt 19:`);
    console.log(`   - Empleados: Joaquin Sanchez, Lucas Galdini`);
    console.log(`   - Horas: ${hoursWorked1}h`);
    console.log(`   - Horario: ${startTime1} - ${endTime1}`);
    
    console.log(`\n2. Piccolo Rododendro:`);
    console.log(`   - Empleados: Bianca Nichele, Bautista Solda`);
    console.log(`   - Horas: ${hoursWorked2}h`);
    console.log(`   - Horario: ${startTime2} - ${endTime2}`);
    
    console.log(`\n3. Horas manuales Nicolas (ID 1): ${hoursNicolas}h`);
    console.log(`4. Horas manuales Gabriel (ID 2): ${hoursGabriel}h\n`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

addTuesdayJobs();

