# MASSEQ · Flota de maquinaria

Prueba técnica para el cargo de **Desarrollador FrontEnd** en MASSEQ.

Aplicación para gestionar una flota de maquinaria pesada (volquetas, retroexcavadoras, excavadoras,
motoniveladoras, vibrocompactadores, cargadores, bulldozer, carrotanque y planta trituradora): listar,
buscar, ver el detalle, agregar, editar y eliminar equipos.

> Los datos son **de ejemplo**; no corresponden a la flota real de MASSEQ.

## Despliegue

| Parte | URL |
| --- | --- |
| Web (Vercel) | https://prueba-masseq.vercel.app |
| API (Render) | https://masseq-flota-api.onrender.com |
| App móvil (APK) | _por completar_ |

> **Nota sobre Render gratuito:** el servidor se duerme tras unos minutos sin uso; la primera petición
> puede tardar hasta un minuto (la web muestra el aviso *"Conectando con el servidor…"*). Además, el
> disco no es persistente: **los cambios (equipos creados, editados o eliminados) se pierden cuando el
> servidor se reinicia** y los datos vuelven a los 14 equipos iniciales de `data/seed.json`.

## Estructura del monorepo

```
backend/   API REST propia (Node + Express 5)
web/       Frontend web (Angular 21 + Angular Material)
mobile/    App móvil (Flutter) – en desarrollo
```

## Tecnologías

- **Backend:** Node.js 22, Express 5, CORS. Persistencia en archivo JSON (`data/db.json`).
- **Web:** Angular 21 (componentes standalone, signals, control flow `@if/@for`, zoneless),
  Angular Material 21 (tema M3 *azure*), formularios reactivos, `HttpClient` con `withFetch()`,
  rutas *lazy* con `withComponentInputBinding()`, `rxResource`.
- **Despliegue:** Vercel (web) y Render (API).

## Cómo ejecutar en local

Requisitos: Node 22 y npm 10.

### 1. Backend (puerto 3000)

```bash
cd backend
npm install
npm run dev      # recarga automática; o "npm start"
npm run reset    # restaura data/db.json con los datos iniciales
```

### 2. Web (puerto 4200)

```bash
cd web
npm install      # el .npmrc incluye legacy-peer-deps
npm start        # ng serve → http://localhost:4200
npm run build    # compila a dist/web/browser
```

La web usa `http://localhost:3000` cuando corre en `localhost` y la API de Render en cualquier otro host
(ver `web/src/app/core/api.config.ts`).

## API

Modelo de un equipo:

```json
{
  "id": 1,
  "title": "Volqueta Doble Troque VQ-01",
  "type": "volqueta",
  "brand": "Kenworth",
  "model": "T800",
  "year": 2019,
  "capacity": "14 m³",
  "status": "en_obra",
  "location": "Obra vial – Tramo Tesalia–Paicol",
  "description": "…",
  "image": "/images/volqueta.svg"
}
```

- `type`: `volqueta | retroexcavadora | excavadora | motoniveladora | vibrocompactador | cargador | bulldozer | carrotanque | trituradora`
- `status`: `disponible | en_obra | mantenimiento`
- `image` (opcional): URL `http(s)` o una ilustración propia `/images/<tipo>.svg`. Si se omite, se asigna la ilustración del tipo.

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/machines?search=texto` | Lista los equipos (búsqueda opcional por nombre, marca o modelo, sin tildes) |
| GET | `/api/machines/:id` | Detalle de un equipo |
| POST | `/api/machines` | Crea un equipo (201) |
| PUT | `/api/machines/:id` | Reemplaza un equipo; sin imagen → ilustración del tipo |
| PATCH | `/api/machines/:id` | Actualiza parcialmente; si cambia el tipo y la imagen era una ilustración, se ajusta |
| DELETE | `/api/machines/:id` | Elimina un equipo (204) |
| GET | `/api/catalog` | Tipos y estados válidos |
| GET | `/api/health` | Estado del servicio |
| GET | `/images/<tipo>.svg` | Ilustraciones de cada tipo de equipo |

Los errores de validación responden `400` con `{ "message": "...", "errors": ["..."] }` en español.

## Requisitos cumplidos (web)

- [x] **Inicio:** todos los equipos en cuadrícula (CSS grid) con imagen y título.
- [x] **Buscador** por nombre/título, que también busca marca y modelo y no distingue tildes.
- [x] Extra: **filtros por tipo y estado** y **contadores por estado** (clic para filtrar); los filtros se guardan en la URL.
- [x] **Detalle** al hacer clic en un equipo (`/maquinaria/:id`).
- [x] **Agregar** equipo (`/maquinaria/nueva`); aparece en el listado.
- [x] **Editar** equipo (`/maquinaria/:id/editar`); los cambios se ven en el listado y en el detalle.
- [x] **Eliminar** con diálogo de confirmación; desaparece del listado.
- [x] `MachineService` con `HttpClient` y un signal `machines` que se actualiza tras crear, editar o eliminar.
- [x] Formulario reactivo con validaciones y mensajes en español, y **vista previa** de la imagen.
- [x] Imágenes relativas (`/images/...`) resueltas contra la API; si una imagen falla se usa la ilustración del tipo.
- [x] Estados de **carga**, **error** (con reintentar) y **sin resultados**; aviso si la API tarda más de 3 s.
- [x] Diseño responsive con la identidad de MASSEQ (azul `#1e4e9c`, acento amarillo `#f5b400`).
- [x] `vercel.json` con *rewrites* para las rutas de la SPA.

## Autor

Desarrollado por **Juan Eduardo Díaz Martínez**.
