import { NextResponse } from 'next/server';
import { getSpreadsheetData, appendSpreadsheetData } from '@/lib/googleSheets';
import { getSheetsConfig } from '@/lib/sheetsConfig';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart'); // YYYY-MM-DD

    const config = getSheetsConfig();

    // Leer datos del calendario (ahora con más columnas)
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:Z');
    const rows = calendarData.slice(1);

    // Procesar datos
    const jobs = rows.map((row) => ({
      id: row[0] || '',
      date: row[1] || '',
      day: row[2] || '',
      startTime: row[3] || '',
      endTime: row[4] || '',
      type: row[5] || '',
      cleaningType: row[6] || '', // Tipo di Pulizia: "Profonda" o "Repasso"
      propertyId: row[7] || '',
      propertyName: row[8] || '',
      client: row[9] || '',
      resource1Id: row[10] || '',
      resource1Name: row[11] || '',
      resource2Id: row[12] || '',
      resource2Name: row[13] || '',
      resource3Id: row[14] || '',
      resource3Name: row[15] || '',
      resource4Id: row[16] || '',
      resource4Name: row[17] || '',
      resource5Id: row[18] || '',
      resource5Name: row[19] || '',
      resource6Id: row[20] || '',
      resource6Name: row[21] || '',
      coordinatorId: row[22] || '',
      hoursWorked: row[23] || '',
      status: row[24] || '',
      notes: row[25] || '',
    }));

    // Si se especifica una semana, filtrar
    if (weekStart) {
      const startDate = new Date(weekStart);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      const filteredJobs = jobs.filter((job) => {
        if (!job.date) return false;
        const jobDate = new Date(job.date);
        return jobDate >= startDate && jobDate <= endDate;
      });

      return NextResponse.json({ jobs: filteredJobs, weekStart });
    }

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener calendario';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, startTime, endTime, propertyId, clientId, cleaningType } = body;

    if (!date || !propertyId || !clientId) {
      return NextResponse.json(
        { error: 'Fecha, propiedad y cliente son requeridos' },
        { status: 400 }
      );
    }

    const config = getSheetsConfig();

    // Leer clientes y propiedades para obtener nombres
    const clientsData = await getSpreadsheetData(config.sheets.clients, 'Clienti!A:Z');
    const clientsRows = clientsData.slice(1);
    const client = clientsRows.find(row => row[0] === clientId);
    const clientName = client ? (client[1] || '') : '';

    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z');
    const propertiesRows = propertiesData.slice(1);
    const property = propertiesRows.find(row => row[0] === propertyId);
    const propertyName = property ? (property[4] || '') : '';

    // Leer calendario para obtener el próximo ID
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:A');
    const nextId = calendarData.length;

    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const dateObj = new Date(date);
    const dayName = dayNames[dateObj.getDay()];

    const newJob = [
      nextId.toString(),
      date,
      dayName,
      startTime || '',
      endTime || '',
      'Lavoro',
      cleaningType || '',
      propertyId,
      propertyName,
      clientName,
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      'Pianificato',
      '',
    ];

    await appendSpreadsheetData(config.sheets.calendar, 'Calendario!A:Z', [newJob]);

    return NextResponse.json({ 
      success: true, 
      message: 'Evento creato con successo',
      id: nextId.toString(),
    });
  } catch (error) {
    console.error('Error creating job:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore nella creazione del lavoro';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
