import { NextResponse } from 'next/server';
import { getSpreadsheetData } from '@/lib/googleSheets';
import { getSheetsConfig } from '@/lib/sheetsConfig';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM

    const config = getSheetsConfig();

    // Leer recursos
    const resourcesData = await getSpreadsheetData(config.sheets.resources, 'Risorse!A:G');
    const resourcesRows = resourcesData.slice(1);

    const resources = resourcesRows.map((row) => ({
      id: row[0] || '',
      name: row[1] || '',
      surname: row[2] || '',
      email: row[3] || '',
      phone: row[4] || '',
      role: row[5] || '',
      active: row[6] || '',
    }));

    // Por ahora, todas las horas en 0 (mockdata)
    const resourcesWithHours = resources.map((resource) => {
      return {
        ...resource,
        totalHours: '0.00',
        jobsCount: 0,
        jobs: [],
      };
    });

    return NextResponse.json({
      resources: resourcesWithHours,
      month: month || null,
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener recursos';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

