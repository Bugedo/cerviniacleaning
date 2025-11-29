import { NextResponse } from 'next/server';
import {
  getSpreadsheetData,
  appendSpreadsheetData,
  getGoogleSheetsClient,
} from '@/lib/googleSheets';
import { getSheetsConfig } from '@/lib/sheetsConfig';

interface ManualHour {
  id: string;
  resourceId: string;
  date: string;
  hours: number;
  notes?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const month = searchParams.get('month'); // YYYY-MM

    const config = getSheetsConfig();

    // Intentar leer de la hoja "Ore Manuali" en el spreadsheet de recursos
    try {
      const manualHoursData = await getSpreadsheetData(config.sheets.resources, 'Ore Manuali!A:E');
      const rows = manualHoursData.slice(1); // Excluir header

      let manualHours: ManualHour[] = rows
        .filter((row) => row[0] && row[1] && row[2] && row[3]) // Filtrar filas vacías
        .map((row) => ({
          id: row[0] || '',
          resourceId: row[1] || '',
          date: row[2] || '',
          hours: parseFloat(row[3] || '0'),
          notes: row[4] || '',
        }));

      // Filtrar por resourceId si se proporciona
      if (resourceId) {
        manualHours = manualHours.filter((mh) => mh.resourceId === resourceId);
      }

      // Filtrar por mes si se proporciona
      if (month) {
        manualHours = manualHours.filter((mh) => mh.date.startsWith(month));
      }

      return NextResponse.json({ manualHours });
    } catch {
      // Si la hoja no existe, retornar vacío
      console.log('Hoja "Ore Manuali" no existe aún, retornando vacío');
      return NextResponse.json({ manualHours: [] });
    }
  } catch (error) {
    console.error('Error fetching manual hours:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener horas manuales';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resourceId, date, hours, notes } = body;

    if (!resourceId || !date || hours === undefined) {
      return NextResponse.json(
        { error: 'resourceId, date y hours son requeridos' },
        { status: 400 },
      );
    }

    const config = getSheetsConfig();
    const sheets = await getGoogleSheetsClient();

    // Verificar si la hoja "Ore Manuali" existe, si no, crearla
    try {
      await getSpreadsheetData(config.sheets.resources, 'Ore Manuali!A1');
    } catch {
      // Crear la hoja si no existe
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: config.sheets.resources,
      });

      const sheetExists = spreadsheet.data.sheets?.some(
        (sheet) => sheet.properties?.title === 'Ore Manuali',
      );

      if (!sheetExists) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: config.sheets.resources,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: 'Ore Manuali',
                  },
                },
              },
            ],
          },
        });

        // Agregar headers
        await sheets.spreadsheets.values.update({
          spreadsheetId: config.sheets.resources,
          range: 'Ore Manuali!A1:E1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['ID', 'ID Risorsa', 'Data', 'Ore', 'Note']],
          },
        });
      }
    }

    // Leer datos existentes para obtener el próximo ID
    let manualHoursData: string[][] = [];
    try {
      manualHoursData = await getSpreadsheetData(config.sheets.resources, 'Ore Manuali!A:E');
    } catch {
      manualHoursData = [['ID', 'ID Risorsa', 'Data', 'Ore', 'Note']];
    }

    const nextId = manualHoursData.length.toString();

    // Verificar si ya existe una entrada para este recurso y fecha
    const existingRowIndex = manualHoursData.findIndex(
      (row, index) => index > 0 && row[1] === resourceId && row[2] === date,
    );

    if (existingRowIndex > 0) {
      // Actualizar fila existente (mantener el ID existente)
      const existingId = manualHoursData[existingRowIndex][0];
      const rowNumber = existingRowIndex + 1;
      const updatedRow = [existingId, resourceId, date, hours.toString(), notes || ''];

      await sheets.spreadsheets.values.update({
        spreadsheetId: config.sheets.resources,
        range: `Ore Manuali!A${rowNumber}:E${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [updatedRow],
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Ore manuali aggiornate con successo',
        id: existingId,
      });
    } else {
      // Agregar nueva fila
      const newRow = [nextId, resourceId, date, hours.toString(), notes || ''];
      await appendSpreadsheetData(config.sheets.resources, 'Ore Manuali!A:E', [newRow]);

      return NextResponse.json({
        success: true,
        message: 'Ore manuali salvate con successo',
        id: nextId,
      });
    }
  } catch (error) {
    console.error('Error saving manual hours:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Errore nel salvataggio delle ore manuali';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
