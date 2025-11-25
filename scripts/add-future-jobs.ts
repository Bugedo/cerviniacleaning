import { getSpreadsheetData, appendSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function addFutureJobs() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('📅 Agregando eventos futuros al calendario...\n');

    // Leer calendario para obtener el próximo ID
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:A');
    const nextId = calendarData.length;

    // Leer recursos para obtener nombres
    const resourcesData = await getSpreadsheetData(config.sheets.resources, 'Risorse!A:G');
    const resourcesRows = resourcesData.slice(1);
    
    const getResourceName = (id: string): string => {
      const resource = resourcesRows.find(row => row[0] === id);
      return resource ? `${resource[1] || ''} ${resource[2] || ''}`.trim() : '';
    };

    // Fecha: hoy (o la fecha que el usuario quiera, por ahora usaré una fecha futura)
    // El usuario no especificó la fecha, usaré mañana como ejemplo
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const jobDate = tomorrow.toISOString().split('T')[0];
    
    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const date = new Date(jobDate);
    const dayName = dayNames[date.getDay()];

    // Evento 1: Breuil Q456 con Bianca, Bautista y Ayelen
    const job1 = [
      nextId.toString(),
      jobDate,
      dayName,
      '10:00', // Ora Inizio
      '', // Ora Fine (vacío porque es futuro)
      'Lavoro',
      '', // Tipo di Pulizia (a definir)
      '12', // ID Proprietà - Breuil Q456
      'Breuil Q456', // Nome Proprietà
      'Il Cervino', // Cliente
      '8', // ID Risorsa 1 - Bianca
      getResourceName('8'), // Nome Risorsa 1
      '9', // ID Risorsa 2 - Bautista
      getResourceName('9'), // Nome Risorsa 2
      '3', // ID Risorsa 3 - Ayelen
      getResourceName('3'), // Nome Risorsa 3
      '', // ID Risorsa 4
      '', // Nome Risorsa 4
      '', // ID Risorsa 5
      '', // Nome Risorsa 5
      '', // ID Risorsa 6
      '', // Nome Risorsa 6
      '', // ID Coordinatore
      '', // Ore Lavorate (vacío porque no tiene hora de fin)
      'Pianificato', // Stato
      'Evento futuro - sin hora de finalización',
    ];

    // Evento 2: Montabel M112 con Lucas y Lucia
    const job2 = [
      (nextId + 1).toString(),
      jobDate,
      dayName,
      '10:00', // Ora Inizio
      '', // Ora Fine (vacío porque es futuro)
      'Lavoro',
      '', // Tipo di Pulizia (a definir)
      '14', // ID Proprietà - Montabel M112
      'Condominio Montabel M112', // Nome Proprietà
      'Il Cervino', // Cliente
      '6', // ID Risorsa 1 - Lucas
      getResourceName('6'), // Nome Risorsa 1
      '7', // ID Risorsa 2 - Lucia
      getResourceName('7'), // Nome Risorsa 2
      '', // ID Risorsa 3
      '', // Nome Risorsa 3
      '', // ID Risorsa 4
      '', // Nome Risorsa 4
      '', // ID Risorsa 5
      '', // Nome Risorsa 5
      '', // ID Risorsa 6
      '', // Nome Risorsa 6
      '', // ID Coordinatore
      '', // Ore Lavorate (vacío porque no tiene hora de fin)
      'Pianificato', // Stato
      'Evento futuro - sin hora de finalización',
    ];

    // Evento 3: Chalet privado de Stefania (sin horario ni recursos aún)
    const job3 = [
      (nextId + 2).toString(),
      jobDate,
      dayName,
      '', // Ora Inizio (vacío - sin horario aún)
      '', // Ora Fine (vacío - sin horario aún)
      'Lavoro',
      '', // Tipo di Pulizia (a definir)
      '15', // ID Proprietà - Valtournenche - frazione Cretaz
      'Valtournenche - frazione Cretaz', // Nome Proprietà
      'Stefania', // Cliente
      '', // ID Risorsa 1 (sin recursos asignados aún)
      '', // Nome Risorsa 1
      '', // ID Risorsa 2
      '', // Nome Risorsa 2
      '', // ID Risorsa 3
      '', // Nome Risorsa 3
      '', // ID Risorsa 4
      '', // Nome Risorsa 4
      '', // ID Risorsa 5
      '', // Nome Risorsa 5
      '', // ID Risorsa 6
      '', // Nome Risorsa 6
      '', // ID Coordinatore
      '', // Ore Lavorate (vacío porque no tiene horario)
      'Pianificato', // Stato
      'Evento futuro - horario posterior a las 10:00 - sin recursos asignados aún',
    ];

    await appendSpreadsheetData(config.sheets.calendar, 'Calendario!A:Z', [job1, job2, job3]);
    
    console.log('✅ Eventos agregados:\n');
    console.log(`   1. Breuil Q456 - ${jobDate} (${dayName}) 10:00`);
    console.log(`      Empleados: Bianca, Bautista, Ayelen\n`);
    console.log(`   2. Montabel M112 - ${jobDate} (${dayName}) 10:00`);
    console.log(`      Empleados: Lucas, Lucia\n`);
    console.log(`   3. Valtournenche - frazione Cretaz (Stefania) - ${jobDate} (${dayName})`);
    console.log(`      Horario: Posterior a las 10:00 (sin definir)`);
    console.log(`      Recursos: Sin asignar\n`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

addFutureJobs();

