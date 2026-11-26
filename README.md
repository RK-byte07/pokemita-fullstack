# 🎮 Pokemita Full Stack — Simulador competitivo Pokémon

Pokemita es una aplicación web para preparar equipos, consultar información competitiva y simular batallas de Pokémon en el formato **Gen 9 OU**. Puedes combatir contra la IA, observar enfrentamientos automáticos y revisar tu rendimiento desde el perfil.

## 🚀 Funcionalidades

- **Batallas en tiempo real.** Juega contra la IA o mira una batalla IA vs. IA. El motor de Pokémon Showdown ejecuta los turnos en el backend y la interfaz recibe las actualizaciones por WebSocket.
- **Dos variantes de reglas.** Juega en **OU estricto** o en **Pokemita con mochila**, que incorpora objetos consumibles para curar, restaurar estados o revivir.
- **Constructor de equipos.** Configura seis Pokémon con sus movimientos, habilidades, objetos, naturalezas, EVs e IVs. Puedes generar un equipo aleatorio, validar su legalidad para Gen 9 OU y guardar o cargar tus equipos.
- **Pokédex competitiva.** Busca Pokémon de hasta la novena generación, filtra por tipo o tier y consulta estadísticas base, habilidades, movimientos y afinidades defensivas. Incluye un reporte de uso de Smogon guardado en el repositorio.
- **Perfil e historial.** Personaliza tu avatar y biografía, consulta el historial de batallas manuales contra la IA y revisa estadísticas como victorias, actividad y rendimiento por equipo.
- **Wiki y guía del meta.** Consulta conceptos de combate competitivo, roles, amenazas y criterios para preparar un equipo.
- **Cuenta y verificación en dos pasos.** El registro y el inicio de sesión usan contraseñas almacenadas como hashes con bcryptjs y sesiones con JWT. Puedes activar 2FA con códigos TOTP y una aplicación autenticadora mediante un código QR.

## 🛠️ Arquitectura y tecnologías

| Componente | Tecnologías | Despliegue |
| --- | --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, React Router, Axios y la API WebSocket del navegador | **Netlify** |
| Backend | Node.js, Express, `ws`, `pokemon-showdown`, `jsonwebtoken`, `bcryptjs` y `qrcode` | **Render** |
| Base de datos | MySQL con el cliente `mysql2` | **Aiven** |

El frontend consulta el catálogo, valida equipos y gestiona el perfil mediante la **API REST**. Durante el combate, el navegador mantiene una conexión **WebSocket** con el backend para enviar jugadas y recibir el estado actualizado. El motor de Pokémon Showdown y sus datos se cargan como una librería de Node.js en el backend. MySQL almacena las cuentas, los equipos guardados y el historial de batallas manuales.

## 💻 Desarrollo local

### Requisitos

- **Node.js 24** y npm. Esta es la versión de Node.js utilizada para verificar la instalación y la compilación.
- **Git**.
- Una instancia **MySQL** accesible. Puedes usar una instalación local, XAMPP o una instancia de desarrollo remota.

### 1. Instalar dependencias

```bash
git clone https://github.com/xRodrigoJrx/pokemita-fullstack.git
cd pokemita-fullstack
npm ci
npm --prefix backend ci
npm --prefix frontend ci
```

La instalación en la raíz es necesaria porque allí se declaran `mysql2`, `bcryptjs` y `jsonwebtoken`, que usa el backend. Si npm 11 indica que falta `pg` en el lockfile del backend, regenera ese lockfile con `npm --prefix backend install --package-lock-only` y vuelve a ejecutar `npm --prefix backend ci`. Ese comando modifica `backend/package-lock.json`.

### 2. Preparar MySQL y configurar el backend

Crea la base de datos e importa el esquema SQL de tu instalación de Pokemita. El repositorio no incluye un archivo SQL de inicialización, así que para configurar una base vacía necesitas una exportación del esquema con las tablas de usuarios, equipos y batallas, y la estructura de perfiles que consulta la aplicación.

Crea `backend/.env` tomando como referencia `backend/.env.example` y agrega las variables de MySQL:

```dotenv
NODE_ENV=development
PORT=3000
JWT_SECRET=reemplaza_con_un_valor_aleatorio
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=pokemita_db
```

Usa un secreto JWT propio y mantén `.env` fuera del repositorio.

### 3. Iniciar ambos servicios

En terminales separadas, desde la raíz del proyecto:

```bash
npm --prefix backend run dev
```

```bash
npm --prefix frontend run dev
```

Abre **http://localhost:5173**. El frontend usa **http://localhost:3000** como origen local del backend. Si usas otro puerto o servidor, configura `VITE_API_URL` en `frontend/.env` con el origen de la API, sin el sufijo `/api`.

## ☁️ Despliegue en la nube

### Aiven · MySQL

Crea o selecciona un servicio MySQL e importa el esquema de Pokemita. En Render configura `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` con los datos del servicio de Aiven. Si tu instancia exige TLS con verificación de certificado, configura la CA de Aiven en la conexión de `mysql2` en `backend/src/db.js`.

### Render · Backend

Crea un **Web Service** vinculado al repositorio y usa la **raíz del repositorio** como directorio de trabajo.

- **Build Command** — `npm ci && npm --prefix backend ci`
- **Start Command** — `npm --prefix backend start`
- **Variables** — `NODE_VERSION=24`, `NODE_ENV=production`, un `JWT_SECRET` generado y las variables de MySQL.
- **Health Check Path** — `/`

El archivo `render.yaml` usa `rootDir: backend`. Si prefieres desplegar con ese Blueprint, ajusta el directorio y los comandos para instalar también las dependencias de la raíz. Si surge el error de lockfile de npm 11, corrige y guarda el lockfile del backend antes del despliegue.

### Netlify · Frontend

El archivo `netlify.toml` configura `frontend` como directorio base, `npm run build` como comando de compilación y `dist` como carpeta de publicación. También redirige las rutas internas a `index.html` para que React Router funcione al recargar la página.

Configura `VITE_API_URL` con la URL HTTPS del servicio de Render, sin el sufijo `/api`, y vuelve a desplegar el sitio. El frontend usa ese origen para la API y deriva de él la conexión segura `wss://` de las batallas. El archivo `netlify.toml` declara Node.js 20. Para reproducir la configuración verificada, cambia ese valor a `24` antes de compilar en Netlify.

## 🧪 Pruebas y compilación

```bash
npm --prefix backend test
npm --prefix frontend run lint
npm --prefix frontend run build
```
