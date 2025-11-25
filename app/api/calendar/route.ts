import { NextResponse } from 'next/server';
import { getSpreadsheetData } from '@/lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart'); // YYYY-MM-DD

    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    // Leer datos del calendario
    const calendarData = await getSpreadsheetData(config.sheets.calendar, 'Calendario!A:Q');
    const rows = calendarData.slice(1);

    // Procesar datos
    const jobs = rows.map((row) => ({
      id: row[0] || '',
      date: row[1] || '',
      day: row[2] || '',
      startTime: row[3] || '',
      endTime: row[4] || '',
      type: row[5] || '',
      propertyId: row[6] || '',
      propertyName: row[7] || '',
      client: row[8] || '',
      resource1Id: row[9] || '',
      resource1Name: row[10] || '',
      resource2Id: row[11] || '',
      resource2Name: row[12] || '',
      coordinatorId: row[13] || '',
      hoursWorked: row[14] || '',
      status: row[15] || '',
      notes: row[16] || '',
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

