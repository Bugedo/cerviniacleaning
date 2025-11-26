import { getGoogleSheetsClient, getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function cleanupDuplicateEvents() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🧹 Limpiando eventos duplicados...\n');

    const calendarSheetId = config.sheets.calendar;
    const sheets = await getGoogleSheetsClient();

    // Obtener sheetId
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: calendarSheetId,
    });
    
    const calendarSheet = spreadsheet.data.sheets?.find(sheet => 
      sheet.properties?.title === 'Calendario'
    );
    
    if (!calendarSheet?.properties?.sheetId) {
      throw new Error('No se encontró la hoja "Calendario"');
    }
    
    const sheetId = calendarSheet.properties.sheetId;

    // Leer calendario
    const calendarData = await getSpreadsheetData(calendarSheetId, 'Calendario!A:Z');
    const headers = calendarData[0];
    const rows = calendarData.slice(1);

    // Agrupar eventos por fecha y propiedad
    const eventsByKey: Record<string, Array<{ rowIndex: number; id: string; cleaningType: string }>> = {};
    
    rows.forEach((row, index) => {
      const id = row[0]?.toString() || '';
      const date = row[1]?.toString() || '';
      const propertyId = row[7]?.toString() || '';
      const cleaningType = row[6]?.toString() || '';
      const type = row[5]?.toString() || '';
      
      // Solo procesar trabajos (Lavoro)
      if (type === 'Lavoro' && date && propertyId) {
        const key = `${date}-${propertyId}`;
        if (!eventsByKey[key]) {
          eventsByKey[key] = [];
        }
        eventsByKey[key].push({
          rowIndex: index + 2, // +2 porque index es 0-based y hay header
          id,
          cleaningType,
        });
      }
    });

    // Encontrar duplicados
    const rowsToDelete: number[] = [];
    
    Object.entries(eventsByKey).forEach(([key, events]) => {
      if (events.length > 1) {
        const [date, propertyId] = key.split('-');
        console.log(`\n⚠️  Duplicados encontrados: ${date} - Propiedad ${propertyId} (${events.length} eventos)`);
        
        // Separar por tipo de limpieza
        const profondaEvents = events.filter(e => e.cleaningType === 'Profonda');
        const repassoEvents = events.filter(e => e.cleaningType === 'Repasso');
        const sinTipoEvents = events.filter(e => !e.cleaningType || e.cleaningType === '');
        
        // Si hay Profonda y Repasso, mantener solo Profonda
        if (profondaEvents.length > 0 && repassoEvents.length > 0) {
          console.log(`   ✅ Mantener Profonda (${profondaEvents.length}), eliminar Repasso (${repassoEvents.length})`);
          repassoEvents.forEach(event => {
            rowsToDelete.push(event.rowIndex);
            console.log(`   🗑️  Eliminar: Fila ${event.rowIndex} - ID ${event.id} (Repasso)`);
          });
        }
        
        // Si hay múltiples del mismo tipo, mantener solo el primero
        if (profondaEvents.length > 1) {
          console.log(`   ⚠️  Múltiples Profonda, mantener solo el primero`);
          profondaEvents.slice(1).forEach(event => {
            rowsToDelete.push(event.rowIndex);
            console.log(`   🗑️  Eliminar: Fila ${event.rowIndex} - ID ${event.id} (Profonda duplicado)`);
          });
        }
        
        if (repassoEvents.length > 1 && profondaEvents.length === 0) {
          console.log(`   ⚠️  Múltiples Repasso, mantener solo el primero`);
          repassoEvents.slice(1).forEach(event => {
            rowsToDelete.push(event.rowIndex);
            console.log(`   🗑️  Eliminar: Fila ${event.rowIndex} - ID ${event.id} (Repasso duplicado)`);
          });
        }
        
        if (sinTipoEvents.length > 1) {
          console.log(`   ⚠️  Múltiples sin tipo, mantener solo el primero`);
          sinTipoEvents.slice(1).forEach(event => {
            rowsToDelete.push(event.rowIndex);
            console.log(`   🗑️  Eliminar: Fila ${event.rowIndex} - ID ${event.id} (sin tipo duplicado)`);
          });
        }
      }
    });

    if (rowsToDelete.length === 0) {
      console.log('\n✅ No se encontraron eventos duplicados\n');
      return;
    }

    console.log(`\n⚠️  Se eliminarán ${rowsToDelete.length} evento(s) duplicado(s)\n`);

    // Eliminar filas (de mayor a menor para no afectar índices)
    const sortedRows = [...rowsToDelete].sort((a, b) => b - a);
    
    // Agrupar todas las eliminaciones en una sola operación batch
    const deleteRequests = sortedRows.map(rowIndex => ({
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS' as const,
          startIndex: rowIndex - 1, // 0-indexed
          endIndex: rowIndex,
        },
      },
    }));

    // Dividir en batches de máximo 50 requests (límite de la API)
    const batchSize = 50;
    for (let i = 0; i < deleteRequests.length; i += batchSize) {
      const batch = deleteRequests.slice(i, i + batchSize);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: calendarSheetId,
        requestBody: {
          requests: batch,
        },
      });
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} fila(s) eliminada(s)`);
      
      // Pequeño delay entre batches para evitar rate limiting
      if (i + batchSize < deleteRequests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n✅ ${rowsToDelete.length} evento(s) duplicado(s) eliminado(s)\n`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

cleanupDuplicateEvents();

