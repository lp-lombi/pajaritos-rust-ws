# Pajaritos Rust WS

App web con:
- Backend: Express + TypeORM + SQLite
- Frontend: React + Vite + TypeScript

## Requisitos

- Node.js 18+
- npm

## Instalacion

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Ejecutar en desarrollo

Backend (puerto 3001):

```bash
cd backend
npm run dev
```

Frontend (puerto 3000):

```bash
cd frontend
npm run dev
```

El frontend usa proxy `/api` -> `http://localhost:3001`.

## Endpoints actuales

Base URL: `http://localhost:3001`

### Health

- `GET /api/health`

Respuesta:

```json
{ "status": "ok" }
```

### Auth

- `POST /api/auth/register`

Body:

```json
{
	"username": "nuevoUsuario",
	"password": "secreto123",
	"roleId": 1
}
```

`roleId` es opcional. Si no viene, usa rol `player`.

- `POST /api/auth/login`

Body:

```json
{
	"username": "admin",
	"password": "admin123"
}
```

### Players

- `GET /api/players`
	- Lista jugadores (incluye `subscription` si existe).

- `POST /api/players`

Body:

```json
{
	"steamid": "76561198000000000",
	"tag": "ElEnanoN",
	"loadSubscription": true
}
```

Reglas:
- `steamid` debe tener exactamente 17 digitos.
- `loadSubscription` es opcional. Si es `true`, crea suscripcion de 30 dias.

- `PATCH /api/players/:id`

Body:

```json
{
	"tag": "NuevoTag"
}
```

- `DELETE /api/players/:id`

Respuesta: `204 No Content`.

## Build

Backend:

```bash
cd backend
npm run build
npm start
```

Frontend:

```bash
cd frontend
npm run build
npm run preview
```
