# Function Calling SQL Demo

Proyecto demostrativo, sencillo y funcional, para mostrar como un modelo de IA puede decidir cuando consultar una tabla SQL mediante function calling.

Las tablas objetivo son `empleados` y `departamentos` (unidas por `departamento_id`). El modelo no recibe acceso directo a SQL: solo puede pedir al backend que ejecute la herramienta controlada `consultar_empleados`.

## Estructura

```txt
.
├── server/
│   ├── db.js
│   ├── index.js
│   ├── openai.js
│   └── tools/
│       └── empleadosTool.js
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── .env.example
├── package.json
└── vite.config.js
```

## Configuracion de la tabla real

Las columnas que puede filtrar el modelo estan definidas en `server/tools/empleadosTool.js`:

```js
const CAMPOS = {
  puesto: 'e."puesto"',
  departamento: 'd."nombre"',
  nombre: 'e."nombre"',
  apellido: 'e."apellido"',
};
```

## Instalacion

```bash
npm install
cp .env.example .env
```

Editá `.env` con tu `OPENAI_API_KEY` y tu `DATABASE_URL` (debe apuntar a una base con las tablas `empleados` y `departamentos`).

## Ejecutar

```bash
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:3000`