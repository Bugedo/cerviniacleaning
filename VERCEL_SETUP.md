# Configuración para Vercel

## Variables de Entorno Requeridas

Para que la aplicación funcione en Vercel, necesitas configurar la siguiente variable de entorno:

### GOOGLE_CREDENTIALS

Esta variable debe contener el contenido completo del archivo JSON de credenciales de Google (`cervinia-cleaning-2eef5bdde34b.json`) como una cadena JSON.

**Cómo configurarla en Vercel:**

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Agrega una nueva variable:
   - **Name:** `GOOGLE_CREDENTIALS`
   - **Value:** Copia y pega el contenido completo del archivo `cervinia-cleaning-2eef5bdde34b.json`
   - **Environment:** Production, Preview, Development (marca todas)

**Ejemplo del valor:**
```json
{"type":"service_account","project_id":"cervinia-cleaning","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"...","universe_domain":"googleapis.com"}
```

**Importante:**
- El valor debe ser una cadena JSON válida (todo en una línea o con `\n` para saltos de línea)
- Asegúrate de escapar correctamente las comillas dobles si es necesario
- Vercel puede manejar valores largos, pero asegúrate de que el JSON esté completo

## Verificación

Después de configurar la variable de entorno, haz un nuevo deploy. La aplicación debería poder conectarse a Google Sheets usando las credenciales desde la variable de entorno.

