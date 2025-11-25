import { getSpreadsheetData, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Script para agregar comentarios a una propiedad
 * Uso: npm run add-comment -- --property="IL GUFFO" --comment="Comentario aquí"
 * O editar los valores directamente en el script
 */

async function addComment() {
  try {
    const args = process.argv.slice(2);
    let propertyLocation = '';
    let comment = '';

    // Parsear argumentos
    args.forEach((arg) => {
      if (arg.startsWith('--property=')) {
        propertyLocation = arg.split('=')[1];
      } else if (arg.startsWith('--comment=')) {
        comment = arg.split('=')[1];
      }
    });

    // Si no se pasaron argumentos, usar valores por defecto (editar aquí)
    if (!propertyLocation || !comment) {
      propertyLocation = propertyLocation || 'IL GUFFO'; // Cambiar aquí
      comment = comment || 'Comentario de prueba'; // Cambiar aquí
      console.log('💡 Usando valores por defecto. Para pasar argumentos:');
      console.log('   npm run add-comment -- --property="IL GUFFO" --comment="Tu comentario"\n');
    }

    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log(`💬 Agregando comentario a "${propertyLocation}"...\n`);

    // Leer propiedades
    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z');
    const headers = propertiesData[0];
    const rows = propertiesData.slice(1);

    // Buscar la propiedad
    const propertyIndex = rows.findIndex((row) => row[4] === propertyLocation);

    if (propertyIndex === -1) {
      console.log(`❌ No se encontró la propiedad "${propertyLocation}"`);
      console.log('\n📋 Propiedades disponibles:');
      rows.forEach((row) => {
        if (row[4]) console.log(`   - ${row[4]}`);
      });
      return;
    }

    const propertyRow = [...rows[propertyIndex]];
    const commentsIndex = headers.indexOf('Commenti');

    if (commentsIndex === -1) {
      console.log('❌ El campo Commenti no existe. Ejecuta: npm run add-comments');
      return;
    }

    // Agregar comentario (si ya hay uno, agregar con fecha)
    const existingComment = propertyRow[commentsIndex] || '';
    const now = new Date().toLocaleString('it-IT');
    const newComment = existingComment
      ? `${existingComment}\n\n[${now}] ${comment}`
      : `[${now}] ${comment}`;

    propertyRow[commentsIndex] = newComment;
    rows[propertyIndex] = propertyRow;

    // Actualizar datos
    const updatedData = [headers, ...rows];
    await updateSpreadsheetData(config.sheets.clients, 'Proprietà!A1', updatedData);

    console.log('✅ Comentario agregado!');
    console.log(`   Propiedad: ${propertyLocation}`);
    console.log(`   Comentario: ${comment}\n`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

addComment();

