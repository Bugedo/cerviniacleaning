# Configuración para Vercel

## Variables de Entorno Requeridas

Para que la aplicación funcione en Vercel, necesitas configurar las siguientes variables de entorno:

### 1. GOOGLE_CREDENTIALS

Esta variable debe contener el contenido completo del archivo JSON de credenciales de Google (`cervinia-cleaning-2eef5bdde34b.json`) como una cadena JSON.

### 2. SHEETS_CONFIG

Esta variable debe contener el contenido completo del archivo `sheets-config.json` que contiene los IDs de los Google Sheets.

**Cómo configurarlas en Vercel:**

#### Opción A: Desde la CLI (Recomendado)

```bash
# Configurar GOOGLE_CREDENTIALS
cat cervinia-cleaning-2eef5bdde34b.json | npx vercel env add GOOGLE_CREDENTIALS production
cat cervinia-cleaning-2eef5bdde34b.json | npx vercel env add GOOGLE_CREDENTIALS preview
cat cervinia-cleaning-2eef5bdde34b.json | npx vercel env add GOOGLE_CREDENTIALS development

# Configurar SHEETS_CONFIG
cat sheets-config.json | npx vercel env add SHEETS_CONFIG production
cat sheets-config.json | npx vercel env add SHEETS_CONFIG preview
cat sheets-config.json | npx vercel env add SHEETS_CONFIG development
```

#### Opción B: Desde el Dashboard de Vercel

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

**GOOGLE_CREDENTIALS:**
   - **Name:** `GOOGLE_CREDENTIALS`
   - **Value:** Copia y pega el contenido completo del archivo `cervinia-cleaning-2eef5bdde34b.json`
   - **Environment:** Production, Preview, Development (marca todas)

**SHEETS_CONFIG:**
   - **Name:** `SHEETS_CONFIG`
   - **Value:** Copia y pega el contenido completo del archivo `sheets-config.json`
   - **Environment:** Production, Preview, Development (marca todas)

**Ejemplo de valores:**

GOOGLE_CREDENTIALS:
```json
{"type":"service_account","project_id":"cervinia-cleaning","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"...","universe_domain":"googleapis.com"}
```

SHEETS_CONFIG:
```json
{"sheets":{"clients":"1shS2aFS20OTZ0tLjrkGlUxN047oWnljZ-j8_nyX-3KA","calendar":"1tYw8ynDZ2k4tYcP5JmOQcIB_DBsT3Caw9JMIvLTrzAY","resources":"1xEYJBAat6SHJbU9pXFXSc9jtxSN03s-CPuGgYH-7KCA","billing":"1ZZnB7ivfDjw-UHw0wzqwVhxqfmKhP7iKqGw764BJWS4"}}
```

**Importante:**
- Los valores deben ser cadenas JSON válidas
- Asegúrate de que el JSON esté completo
- Las variables deben estar configuradas para todos los entornos (Production, Preview, Development)

## Verificación

Después de configurar las variables de entorno, haz un nuevo deploy:

```bash
npx vercel --prod
```

La aplicación debería poder conectarse a Google Sheets usando las credenciales y configuración desde las variables de entorno.

## Verificar Variables Configuradas

Para verificar que las variables están configuradas correctamente:

```bash
npx vercel env ls
```

