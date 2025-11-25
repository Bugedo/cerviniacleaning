# Setup de Google Sheets

## Problema de Permisos

Si encuentras el error "The caller does not have permission", necesitas dar permisos adicionales a la cuenta de servicio:

### Solución 1: Verificar permisos en Google Cloud Console

1. Ve a: https://console.cloud.google.com/iam-admin/serviceaccounts?project=cervinia-cleaning
2. Busca la cuenta: `cervinia-cleaning@cervinia-cleaning.iam.gserviceaccount.com`
3. Haz clic en ella y ve a la pestaña "PERMISSIONS"
4. Asegúrate de que tenga el rol "Editor" o "Owner"

### Solución 2: Crear los sheets manualmente

Si prefieres, puedes crear los Google Sheets manualmente:

1. Ve a tu carpeta compartida en Google Drive
2. Crea 4 Google Sheets con estos nombres:
   - `Cervinia Cleaning - Clienti`
   - `Cervinia Cleaning - Calendario`
   - `Cervinia Cleaning - Risorse`
   - `Cervinia Cleaning - Fatturazione`

3. Comparte cada sheet con: `cervinia-cleaning@cervinia-cleaning.iam.gserviceaccount.com` como Editor

4. Obtén los IDs de cada sheet (de la URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`)

5. Crea el archivo `sheets-config.json` en la raíz del proyecto:

```json
{
  "sheets": {
    "clients": "ID_DEL_SHEET_CLIENTI",
    "calendar": "ID_DEL_SHEET_CALENDARIO",
    "resources": "ID_DEL_SHEET_RISORSE",
    "billing": "ID_DEL_SHEET_FATTURAZIONE"
  }
}
```

6. Luego ejecuta el script de migración de datos:

```bash
npm run migrate-data
```

### Solución 3: La app funciona sin Google Sheets

La app ya funciona leyendo directamente del archivo Excel `APT CERVINIA CLEANING.xlsx`. Puedes usarla así mientras resuelves los permisos de Google Sheets.

