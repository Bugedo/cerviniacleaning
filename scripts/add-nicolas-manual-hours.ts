import { getGoogleSheetsClient, getSpreadsheetData, appendSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function addNicolasManualHours() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('📅 Agregando horas manuales de Nicolas...\n');

    // Obtener el próximo ID
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:A');
    let nextId = calendarData.length;

    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

    // Horas manuales de Nicolas
    const manualHours = [
      {
        date: '2025-11-21', // Viernes
        hours: 2.5, // 2 horas y 30 minutos
        startTime: '09:00',
        endTime: '11:30',
      },
      {
        date: '2025-11-24', // Lunes
        hours: 3.25, // 3 horas y 15 minutos
        startTime: '09:00',
        endTime: '12:15',
      },
      {
        date: '2025-11-25', // Martes
        hours: 11.0, // 11 horas (ya existe, pero verificamos)
        startTime: '08:00',
        endTime: '19:00',
      },
    ];

    // Verificar si ya existen entradas de supervisión para estos días
    const existingEntries: string[] = [];
    calendarData.slice(1).forEach((row) => {
      const date = row[1]?.toString() || '';
      const coordinatorId = row[21]?.toString() || '';
      const type = row[5]?.toString() || '';
      
      if (coordinatorId === '1' && type === 'Supervisione') {
        if (date === '2025-11-21' || date === '2025-11-24' || date === '2025-11-25') {
          existingEntries.push(date);
        }
      }
    });

    const newEntries: string[][] = [];

    manualHours.forEach((entry) => {
      if (existingEntries.includes(entry.date)) {
        console.log(`⚠️  Ya existe entrada de supervisión para ${entry.date}, omitiendo...`);
        return;
      }

      const date = new Date(entry.date);
      const dayName = dayNames[date.getDay()];

      const supervision = [
        (nextId++).toString(),
        entry.date,
        dayName,
        entry.startTime,
        entry.endTime,
        'Supervisione',
        '',
        '',
        'Supervisione giornaliera',
        'Il Cervino',
        '', '', '', '', '', '', '', '', '', '', // Risorsa 1-6 vacías
        '1', // ID Coordinatore - Nicolas
        entry.hours.toString(),
        'Completato',
        `Ore lavorate manuali: ${entry.hours}h`,
      ];

      newEntries.push(supervision);
    });

    if (newEntries.length > 0) {
      await appendSpreadsheetData(config.sheets.calendar, 'Calendario!A:Z', newEntries);
      
      console.log('✅ Horas manuales agregadas:\n');
      manualHours.forEach((entry) => {
        if (!existingEntries.includes(entry.date)) {
          const date = new Date(entry.date);
          const dayName = dayNames[date.getDay()];
          console.log(`   ${entry.date} (${dayName}): ${entry.hours}h (${entry.startTime} - ${entry.endTime})`);
        }
      });
      console.log('');
    } else {
      console.log('⚠️  Todas las horas ya están registradas\n');
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

addNicolasManualHours();

