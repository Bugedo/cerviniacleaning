import { NextResponse } from 'next/server';
import { getSpreadsheetData, getGoogleSheetsClient } from '@/lib/googleSheets';
import { getSheetsConfig } from '@/lib/sheetsConfig';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const config = getSheetsConfig();
    const sheets = await getGoogleSheetsClient();

    // Leer datos para encontrar la fila
    const manualHoursData = await getSpreadsheetData(config.sheets.resources, 'Ore Manuali!A:E');
    const rowIndex = manualHoursData.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Ore manuali non trovate' }, { status: 404 });
    }

    // Obtener sheetId
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: config.sheets.resources,
    });

    const manualHoursSheet = spreadsheet.data.sheets?.find(
      (sheet) => sheet.properties?.title === 'Ore Manuali',
    );

    if (!manualHoursSheet?.properties?.sheetId) {
      throw new Error('No se encontró la hoja "Ore Manuali"');
    }

    const sheetId = manualHoursSheet.properties.sheetId;
    const rowNumber = rowIndex + 1; // +1 porque las filas empiezan en 1

    // Eliminar la fila
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: config.sheets.resources,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowNumber - 1, // 0-indexed
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true, message: 'Ore manuali eliminate con successo' });
  } catch (error) {
    console.error('Error deleting manual hours:', error);
    const errorMessage =
      error instanceof Error ? error.message : "Errore nell'eliminazione delle ore manuali";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
