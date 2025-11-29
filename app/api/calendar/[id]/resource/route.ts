import { NextResponse } from 'next/server';
import { getGoogleSheetsClient, getSpreadsheetData } from '@/lib/googleSheets';
import { getSheetsConfig } from '@/lib/sheetsConfig';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await params;
    const body = await request.json();
    const { resourceIndex, resourceId } = body;

    if (!resourceIndex || !resourceId) {
      return NextResponse.json(
        { error: 'resourceIndex y resourceId son requeridos' },
        { status: 400 },
      );
    }

    const config = getSheetsConfig();
    const calendarSheetId = config.sheets.calendar;
    const sheets = await getGoogleSheetsClient();

    const calendarData = await getSpreadsheetData(calendarSheetId, 'Calendario!A:AF');
    const jobIndex = calendarData.findIndex((row) => row[0] === jobId);

    if (jobIndex === -1) {
      return NextResponse.json({ error: 'Lavoro non trovato' }, { status: 404 });
    }

    const rowIndex = jobIndex + 1;
    const jobRow = calendarData[jobIndex];

    // Calcular índices de columna para el recurso a eliminar
    const resourceIdColIndex = 9 + (resourceIndex - 1) * 2 + 1; // 10, 12, 14, etc.
    const resourceNameColIndex = 9 + (resourceIndex - 1) * 2 + 2; // 11, 13, 15, etc.

    // Función para convertir índice a letra de columna
    const getColumnLetter = (colIndex: number): string => {
      if (colIndex < 26) {
        return String.fromCharCode(65 + colIndex);
      } else {
        const firstLetter = String.fromCharCode(65 + Math.floor((colIndex - 26) / 26));
        const secondLetter = String.fromCharCode(65 + ((colIndex - 26) % 26));
        return firstLetter + secondLetter;
      }
    };

    // Eliminar el recurso (poner vacío)
    const updates = [
      {
        range: `Calendario!${getColumnLetter(resourceIdColIndex)}${rowIndex}`,
        values: [['']],
      },
      {
        range: `Calendario!${getColumnLetter(resourceNameColIndex)}${rowIndex}`,
        values: [['']],
      },
    ];

    // Desplazar recursos siguientes hacia arriba si es necesario
    // (opcional: mantener los recursos en orden sin espacios vacíos)
    const maxResources = 11;
    for (let i = resourceIndex + 1; i <= maxResources; i++) {
      const currentIdCol = 9 + (i - 1) * 2 + 1;
      const currentNameCol = 9 + (i - 1) * 2 + 2;
      const prevIdCol = 9 + (i - 2) * 2 + 1;
      const prevNameCol = 9 + (i - 2) * 2 + 2;

      const currentId = jobRow[currentIdCol] || '';
      const currentName = jobRow[currentNameCol] || '';

      if (currentId) {
        updates.push({
          range: `Calendario!${getColumnLetter(prevIdCol)}${rowIndex}`,
          values: [[currentId]],
        });
        updates.push({
          range: `Calendario!${getColumnLetter(prevNameCol)}${rowIndex}`,
          values: [[currentName]],
        });
        // Limpiar la posición actual
        updates.push({
          range: `Calendario!${getColumnLetter(currentIdCol)}${rowIndex}`,
          values: [['']],
        });
        updates.push({
          range: `Calendario!${getColumnLetter(currentNameCol)}${rowIndex}`,
          values: [['']],
        });
      }
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: calendarSheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updates,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Risorsa rimossa con successo',
    });
  } catch (error) {
    console.error('Error removing resource:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Errore nella rimozione della risorsa';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
