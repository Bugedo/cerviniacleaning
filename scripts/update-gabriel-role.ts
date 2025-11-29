import { getSpreadsheetData, getGoogleSheetsClient } from '../lib/googleSheets';
import { getSheetsConfig } from '../lib/sheetsConfig';

async function updateGabrielRole() {
  try {
    const config = getSheetsConfig();

    console.log('🔄 Actualizando rol de Gabriel Gioria...\n');

    const sheets = await getGoogleSheetsClient();
    const resourcesSheetId = config.sheets.resources;

    // Leer recursos
    const resourcesData = await getSpreadsheetData(resourcesSheetId, 'Risorse!A:G');
    const resourcesRows = resourcesData.slice(1);

    // Buscar Gabriel Gioria
    let gabrielRowIndex = -1;
    resourcesRows.forEach((row, index) => {
      const name = (row[1] || '').toLowerCase();
      const surname = (row[2] || '').toLowerCase();
      if (
        (name.includes('gabriel') || name.includes('gabriele')) &&
        surname.includes('gioria')
      ) {
        gabrielRowIndex = index + 2; // +2 porque empieza en 1 y hay header
        console.log(`✅ Encontrado: ${row[1]} ${row[2]} (ID: ${row[0]}, fila ${gabrielRowIndex})`);
        console.log(`   Rol actual: "${row[5] || ''}"`);
      }
    });

    // También buscar por ID 2 directamente
    if (gabrielRowIndex === -1) {
      resourcesRows.forEach((row, index) => {
        if (row[0] === '2') {
          gabrielRowIndex = index + 2;
          console.log(`✅ Encontrado por ID: ${row[1]} ${row[2]} (ID: ${row[0]}, fila ${gabrielRowIndex})`);
          console.log(`   Rol actual: "${row[5] || ''}"`);
        }
      });
    }

    if (gabrielRowIndex === -1) {
      console.log('❌ No se encontró Gabriel Gioria');
      return;
    }

    // Actualizar rol a "Asistente Coordinador" o "Assistente Coordinatore"
    const newRole = 'Assistente Coordinatore';
    console.log(`\n📝 Actualizando rol a "${newRole}"...`);

    await sheets.spreadsheets.values.update({
      spreadsheetId: resourcesSheetId,
      range: `Risorse!F${gabrielRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newRole]],
      },
    });

    console.log(`✅ Rol actualizado exitosamente!\n`);
    console.log(`📊 Resumen:`);
    console.log(`   - Nombre: Gabriel Gioria`);
    console.log(`   - Nuevo rol: ${newRole}`);
    console.log(`   - Ahora solo usará horas manuales (como el coordinador)`);
    console.log(`   - No aparecerá en la lista de recursos seleccionables para eventos`);
  } catch (error) {
    console.error('❌ Error al actualizar rol:', error);
    throw error;
  }
}

updateGabrielRole();

