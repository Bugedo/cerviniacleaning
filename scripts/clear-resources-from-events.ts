import { getSpreadsheetData, getGoogleSheetsClient } from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

async function clearResourcesFromEvents() {
  try {
    const config = getSheetsConfig();

    console.log('🔄 Limpiando empleados de todos los eventos...\n');

    const sheets = await getGoogleSheetsClient();
    const calendarSheetId = config.sheets.calendar;

    // Leer todos los eventos del calendario (hasta columna AG para cubrir 11 recursos)
    const calendarData = await getSpreadsheetData(calendarSheetId, 'Calendario!A:AG');
    const rows = calendarData.slice(1); // Excluir header

    console.log(`📊 Encontrados ${rows.length} eventos\n`);

    // Las columnas de recursos empiezan en índice 11 (columna L) y van en pares (ID, Name)
    // resource1Id = columna 11 (L), resource1Name = columna 12 (M)
    // resource2Id = columna 13 (N), resource2Name = columna 14 (O)
    // ... hasta resource11Id = columna 31 (AF), resource11Name = columna 32 (AG)

    const updates: Array<{ range: string; values: string[][] }> = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque empieza en 1 y hay header
      
      // Limpiar todos los recursos (1-11)
      for (let i = 1; i <= 11; i++) {
        const idIndex = 10 + (i - 1) * 2 + 1; // 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31
        const nameIndex = 10 + (i - 1) * 2 + 2; // 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32
        
        // Convertir índice a letra de columna
        const getColumnLetter = (colIndex: number): string => {
          if (colIndex < 26) {
            return String.fromCharCode(65 + colIndex);
          } else {
            const firstLetter = String.fromCharCode(65 + Math.floor((colIndex - 26) / 26));
            const secondLetter = String.fromCharCode(65 + ((colIndex - 26) % 26));
            return firstLetter + secondLetter;
          }
        };

        const idColumn = getColumnLetter(idIndex);
        const nameColumn = getColumnLetter(nameIndex);

        // Solo agregar actualización si hay algo que limpiar
        if (row[idIndex] || row[nameIndex]) {
          updates.push({
            range: `Calendario!${idColumn}${rowNumber}`,
            values: [['']],
          });
          updates.push({
            range: `Calendario!${nameColumn}${rowNumber}`,
            values: [['']],
          });
        }
      }
    });

    console.log(`📝 Preparadas ${updates.length} actualizaciones\n`);

    if (updates.length === 0) {
      console.log('✅ No hay empleados para limpiar en los eventos\n');
      return;
    }

    // Actualizar en lotes (Google Sheets tiene un límite de 1000 actualizaciones por batch)
    const BATCH_SIZE = 1000;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      console.log(`   Procesando lote ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} actualizaciones)...`);
      
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: calendarSheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: batch,
        },
      });
    }

    console.log(`\n✅ Todos los empleados han sido eliminados de los eventos`);
    console.log(`\n📊 Resumen:`);
    console.log(`   - Eventos procesados: ${rows.length}`);
    console.log(`   - Actualizaciones realizadas: ${updates.length}`);
  } catch (error) {
    console.error('❌ Error al limpiar empleados:', error);
    throw error;
  }
}

clearResourcesFromEvents();

