# 🎵 Guía de Despliegue y Configuración - Tussi Music

¡Bienvenido a **Tussi Music**! Este proyecto cuenta con la marca renovada a **Tussi Music** con una estética moderna en tonos **rosa neón y magenta (#ff2d87)**, preparada tanto para pruebas en tu ordenador local como para despliegue en **Coolify** en tu Mini PC.

---

## 📑 Índice
1. [Requisitos Previos & Discord Developer Portal](#1-requisitos-previos--discord-developer-portal)
2. [Configuración de Variables de Entorno](#2-configuración-de-variables-de-entorno)
3. [Pruebas en Local (Tu Ordenador)](#3-pruebas-en-local-tu-ordenador)
   - [Opción A: Todo con Docker Compose (Recomendado)](#opción-a-con-docker-compose-recomendado)
   - [Opción B: Manual con Node.js](#opción-b-manual-con-nodejs)
4. [Despliegue en Coolify (Mini PC)](#4-despliegue-en-coolify-mini-pc)
5. [Comandos de Discord y Panel de Administración](#5-comandos-de-discord-y-panel-de-administración)

---

## 1. Requisitos Previos & Discord Developer Portal

Entra en [Discord Developer Portal](https://discord.com/developers/applications) y crea tu aplicación (o usa una existente):

### A. Bot (Pestaña "Bot")
- **Token**: Haz clic en *Reset Token* y copia el `BOT_TOKEN`.
- **Privileged Gateway Intents**: Activa las 3 casillas:
  - ✅ **Presence Intent**
  - ✅ **Server Members Intent**
  - ✅ **Message Content Intent**

### B. OAuth2 (Pestaña "OAuth2")
- Copia tu **Client ID** (`DISCORD_CLIENT_ID`) y **Client Secret** (`DISCORD_CLIENT_SECRET`).
- En **Redirects** (Redirect URIs), añade:
  - Para pruebas locales: `http://localhost:3000/api/auth/discord/callback`
  - Para tu servidor en Coolify: `https://tussimusic.tudominio.com/api/auth/discord/callback`

### C. Invitar al Bot a tu Servidor
- En **OAuth2 > URL Generator**:
  - Scopes: `bot`, `applications.commands`
  - Bot Permissions: `Administrator` (o permisos de voz: Connect, Speak, Use Voice Activity, Send Messages, Embed Links).

---

## 2. Configuración de Variables de Entorno

### 1. Variables del Bot (`aurora-bot/aurora-bot/.env`)
Copia `.env.example` a `.env` en la carpeta `aurora-bot/aurora-bot/`:

```env
SUPPORT_SERVER_LINK=https://discord.gg/tu-servidor
BOT_TOKEN=tu_token_aqui
GUILD_ID=tu_guild_id_principal
LOG_CHANNEL_ID=tu_canal_de_logs_id
WEBHOOK=

# Para Docker Compose en local o Coolify:
MONGODB_URI=mongodb://mongodb:27017/tussimusic
# Si pruebas sin Docker: mongodb://127.0.0.1:27017/tussimusic

WEB_DASHBOARD_URL=http://localhost:3000
BACKEND_PORT=3001
NEXTAUTH_URL=http://localhost:3000

DISCORD_CLIENT_ID=tu_client_id
DISCORD_CLIENT_SECRET=tu_client_secret

RICH_PRESENCE_ENABLED=true
RICH_PRESENCE_NAME=Tussi Music | /play
RICH_PRESENCE_TYPE=Listening
RICH_PRESENCE_STATUS=online
```

### 2. Variables de la Web (`aurora-web/aurora-web/.env.local`)
Copia `.env.example` a `.env.local` en la carpeta `aurora-web/aurora-web/`:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
INTERNAL_API_URL=http://bot:3001
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback
DISCORD_CLIENT_ID=tu_client_id
DISCORD_CLIENT_SECRET=tu_client_secret
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb://mongodb:27017/tussimusic
```

---

## 3. Pruebas en Local (Tu Ordenador)

### Opción A: Con Docker Compose (Recomendado)
El proyecto incluye un archivo `docker-compose.yml` en la raíz que levanta MongoDB, NodeLink, el Bot y la Web Dashboard de una sola vez:

```powershell
# En la raíz del proyecto (c:\Users\zarpi\Documents\TussiMUSCIC2):
docker compose up --build
```

- **Web Dashboard**: Abre `http://localhost:3000`
- **Backend API & WebSockets**: `http://localhost:3001`
- **NodeLink Audio Engine**: `http://localhost:3008`
- **MongoDB**: `localhost:27017`

### Opción B: Manual con Node.js (Sin Docker)
Si prefieres correrlo sin Docker en Windows:

1. **Inicia MongoDB** (por ejemplo con MongoDB Compass / servicio local en el puerto 27017).
2. **Inicia NodeLink**:
   - Descarga el ejecutable o corre el contenedor de NodeLink en el puerto 3008:
     ```bash
     docker run -d --name nodelink -p 3008:3008 -e NODELINK_PASSWORD=youshallnotpass ghcr.io/performanc/nodelink:latest
     ```
3. **Inicia el Bot**:
   ```bash
   cd aurora-bot/aurora-bot
   npm install
   node index.js
   ```
4. **Inicia la Web**:
   ```bash
   cd aurora-web/aurora-web
   npm install
   npm run dev
   ```

---

## 4. Despliegue en Coolify (Mini PC)

Coolify es ideal para autohospedar este proyecto en tu Mini PC.

### Paso 1: Subir el proyecto a GitHub / GitLab
Crea un repositorio privado (ej. `tussi-music`) y sube todos los archivos del proyecto.

### Paso 2: Crear el servicio en Coolify
1. En tu panel de Coolify, selecciona tu **Proyecto** > **Nuevo Recurso** > **Docker Compose**.
2. Conecta tu repositorio de GitHub / GitLab.
3. Coolify detectará automáticamente el archivo [docker-compose.yml](file:///c:/Users/zarpi/Documents/TussiMUSCIC2/docker-compose.yml) de la raíz.

### Paso 3: Configurar Dominios y Puertos en Coolify
En la configuración del servicio en Coolify:
- Asigna un dominio para la Web: `https://tussimusic.tudominio.com` (apuntando al puerto `3000` del contenedor `web`).
- Asigna un subdominio para la API/WebSockets si quieres exponerlo: `https://api.tussimusic.tudominio.com` (apuntando al puerto `3001` del contenedor `bot`).

### Paso 4: Ajustar Variables de Entorno en Coolify
Actualiza las variables para producción:
- `WEB_DASHBOARD_URL=https://tussimusic.tudominio.com`
- `NEXT_PUBLIC_SOCKET_URL=https://api.tussimusic.tudominio.com` (o la URL de tu backend)
- `DISCORD_REDIRECT_URI=https://tussimusic.tudominio.com/api/auth/discord/callback`
- `NEXTAUTH_URL=https://tussimusic.tudominio.com`

### Paso 5: Desplegar
Haz clic en **Deploy**. Coolify compilará los contenedores, generará los certificados SSL gratuitos con Let's Encrypt y arrancará todo el sistema automáticamente.

---

## 5. Comandos de Discord y Panel de Administración

### Hacerte Administrador
Para darte permisos de administrador en la base de datos y acceder al panel de control `/admin`:
```bash
node aurora-web/admin/add-admin.js
```

### Comandos Principales de Discord
- `/play <canción o URL>`: Reproducir música desde YouTube, Spotify, Apple Music, SoundCloud, etc.
- `/pause` / `/resume`: Pausar o reanudar.
- `/skip`: Pasar a la siguiente canción.
- `/queue`: Ver y administrar la lista de reproducción.
- `/volume <0-200>`: Ajustar el volumen.
- `/shuffle`: Mezclar la cola.
- `/autoplay`: Activar o desactivar reproducción automática continua.
- `/seek <tiempo>`: Avanzar o retroceder a un minuto exacto.
- `/redeem <código>`: Canjear suscripciones o ventajas Premium.
