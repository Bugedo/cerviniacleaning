import { NextResponse } from 'next/server';
import { getSpreadsheetData, appendSpreadsheetData } from '@/lib/googleSheets';
import { getSheetsConfig } from '@/lib/sheetsConfig';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart'); // YYYY-MM-DD

    const config = getSheetsConfig();

    // Leer datos del calendario (ahora incluyendo check-in y check-out)
    // Columnas: A-AK (0-36) = básicos + recursos + check-in/out
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:AK');
    const rows = calendarData.slice(1);

    // Procesar datos (hasta 11 recursos + check-in/out)
    const jobs = rows.map((row) => {
      const job: Record<string, string> = {
        id: row[0] || '',
        date: row[1] || '',
        day: row[2] || '',
        startTime: row[3] || '',
        endTime: row[4] || '',
        type: row[5] || '',
        cleaningType: row[6] || '',
        propertyId: row[7] || '',
        propertyName: row[8] || '',
        client: row[9] || '',
        clientId: row[10] || '', // clientId después del nombre del cliente
        coordinatorId: row[32] || '',
        hoursWorked: row[33] || '',
        status: row[34] || '',
        notes: row[35] || '',
        checkInDate: row[36] || '',
        checkInTime: row[37] || '',
        checkOutDate: row[38] || '',
        checkOutTime: row[39] || '',
      };

      // Agregar recursos 1-11 (empiezan en índice 11)
      for (let i = 1; i <= 11; i++) {
        const idIndex = 10 + (i - 1) * 2 + 1; // 11, 13, 15, etc.
        const nameIndex = 10 + (i - 1) * 2 + 2; // 12, 14, 16, etc.
        job[`resource${i}Id`] = row[idIndex] || '';
        job[`resource${i}Name`] = row[nameIndex] || '';
      }

      return job;
    });

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
    const {
      date,
      startTime,
      endTime,
      propertyId,
      clientId,
      clientName,
      propertyName,
      cleaningType,
      resources,
      isSpecialCase,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
    } = body;

    if (!date) {
      return NextResponse.json({ error: 'La fecha es requerida' }, { status: 400 });
    }

    const config = getSheetsConfig();

    let finalClientName = '';
    let finalPropertyName = '';
    let finalClientId = '';
    let finalPropertyId = '';

    if (isSpecialCase) {
      // Caso especial: usar nombres proporcionados directamente
      if (!clientName || !propertyName) {
        return NextResponse.json(
          { error: 'Para casos especiales, cliente y propiedad son requeridos' },
          { status: 400 },
        );
      }
      finalClientName = clientName;
      finalPropertyName = propertyName;
      finalClientId = 'SPECIAL'; // Marcar como caso especial
      finalPropertyId = 'SPECIAL';
    } else {
      // Caso normal: buscar en la base de datos
      if (!propertyId || !clientId) {
        return NextResponse.json(
          { error: 'Fecha, propiedad y cliente son requeridos' },
          { status: 400 },
        );
      }

      // Leer clientes y propiedades para obtener nombres
      const clientsData = await getSpreadsheetData(config.sheets.clients, 'Clienti!A:Z');
      const clientsRows = clientsData.slice(1);
      const client = clientsRows.find((row) => row[0] === clientId);
      finalClientName = client ? client[1] || '' : '';

      const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z');
      const propertiesRows = propertiesData.slice(1);
      const property = propertiesRows.find((row) => row[0] === propertyId);
      finalPropertyName = property ? property[4] || '' : '';
      finalClientId = property ? property[1] || clientId : clientId; // Usar clientId de la propiedad o el proporcionado
      finalPropertyId = propertyId;
    }

    // Leer recursos para obtener nombres
    const resourcesData = await getSpreadsheetData(config.sheets.resources, 'Risorse!A:G');
    const resourcesRows = resourcesData.slice(1);

    // Leer calendario para obtener el próximo ID
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:A');
    const nextId = calendarData.length;

    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const dateObj = new Date(date);
    const dayName = dayNames[dateObj.getDay()];

    // Preparar array de recursos (hasta 11)
    const resourceFields: string[] = [];
    const resourceList = resources || [];

    for (let i = 1; i <= 11; i++) {
      const resource = resourceList[i - 1];
      if (resource && resource.id) {
        const resourceRow = resourcesRows.find((row) => row[0] === resource.id);
        const resourceName = resourceRow
          ? `${resourceRow[1] || ''} ${resourceRow[2] || ''}`.trim()
          : resource.name || '';
        resourceFields.push(resource.id, resourceName);
      } else {
        resourceFields.push('', '');
      }
    }

    const newJob = [
      nextId.toString(),
      date,
      dayName,
      startTime || '',
      endTime || '',
      'Lavoro',
      cleaningType || '',
      finalPropertyId,
      finalPropertyName,
      finalClientName,
      finalClientId, // Agregar clientId después del nombre del cliente
      ...resourceFields,
      '', // coordinatorId
      '', // hoursWorked
      'Pianificato',
      isSpecialCase ? 'Caso Speciale' : '', // Nota especial para casos especiales
      checkInDate || '', // Check-in Date
      checkInTime || '', // Check-in Time
      checkOutDate || '', // Check-out Date
      checkOutTime || '', // Check-out Time
    ];

    await appendSpreadsheetData(config.sheets.calendar, 'Calendario!A:AK', [newJob]);

    return NextResponse.json({
      success: true,
      message: 'Evento creato con successo',
      id: nextId.toString(),
    });
  } catch (error) {
    console.error('Error creating job:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Errore nella creazione del lavoro';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
