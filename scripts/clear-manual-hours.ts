import { getGoogleSheetsClient } from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

async function clearManualHours() {
  try {
    const config = getSheetsConfig();
    const sheets = await getGoogleSheetsClient();

    console.log('🗑️  Limpiando todas las horas manuales...\n');

    // Verificar si la hoja existe
    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: config.sheets.resources,
      });

      const sheetExists = spreadsheet.data.sheets?.some(
        (sheet) => sheet.properties?.title === 'Ore Manuali',
      );

      if (!sheetExists) {
        console.log('✅ La hoja "Ore Manuali" no existe. No hay nada que limpiar.');
        return;
      }

      // Leer todas las filas (incluyendo header)
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: config.sheets.resources,
        range: 'Ore Manuali!A:E',
      });

      const rows = response.data.values || [];
      
      if (rows.length <= 1) {
        console.log('✅ No hay horas manuales para eliminar (solo header o hoja vacía).');
        return;
      }

      const dataRows = rows.length - 1; // Excluir header
      console.log(`📊 Encontradas ${dataRows} filas de horas manuales (excluyendo header).\n`);

      // Limpiar todas las filas excepto el header
      // Borrar desde la fila 2 hasta el final
      const lastRow = rows.length;
      
      await sheets.spreadsheets.values.clear({
        spreadsheetId: config.sheets.resources,
        range: `Ore Manuali!A2:E${lastRow}`,
      });

      console.log(`✅ Eliminadas ${dataRows} filas de horas manuales.`);
      console.log('✅ La hoja "Ore Manuali" ahora solo contiene el header.');
      console.log('\n✨ Limpieza completada. Puedes empezar a cargar horas manualmente desde cero.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('does not exist')) {
        console.log('✅ La hoja "Ore Manuali" no existe. No hay nada que limpiar.');
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

clearManualHours();

