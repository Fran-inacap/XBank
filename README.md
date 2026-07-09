# XBank

Aplicación bancaria en React + Vite + Firebase para practicar autenticación, saldo en tiempo real, transferencias, historial reactivo y personalización visual.

## Requisitos

- Node.js 18+
- npm
- Proyecto Firebase con Firestore y Authentication habilitados

## Variables de entorno

Copia el archivo .env.example a .env y completa tus credenciales de Firebase:

```bash
cp .env.example .env
```

Variables esperadas:
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

## Ejecución

```bash
npm install
npm run dev
```

Para validar una compilación de producción:

```bash
npm run build
```

## Usuarios de prueba

Puedes crear cuentas nuevas desde la UI o usar estas credenciales si ya las agregaste a Firestore en la colección users:

1. usuario: fernando.alonso@xbank.cl
   contraseña: astonmartin
2. usuario: kimi.antonelli@xbank.cl
   contraseña: mercedes

## Funcionalidades implementadas

- Autenticación con Firebase Authentication
- Dashboard con saldo en tiempo real desde Firestore
- Transferencias entre usuarios con validaciones y registro de movimientos
- Depósito y retiro como operaciones independientes, con confirmación del usuario
- Historial de movimientos en tiempo real, ordenado por fecha y hora
- Fecha del historial con formato `01 de enero de 2026` y hora en formato de 24 horas
- Registro en historial para transferencias, depósitos y retiros
- Filtros acumulables por tipo, mes y contraparte
- Filtro por tipo con opciones de envío, recepción, depósito y retiro
- Modo oscuro persistente con textos contrastantes en las tarjetas principales

## Estructura principal

- src/main.jsx: punto de entrada de la aplicación
- src/App.jsx: interfaz principal con autenticación, saldo, transferencias, depósito/retiro e historial
- src/App.css: estilos de la interfaz, incluyendo modo oscuro
- src/context/AuthContext.jsx: manejo de sesión y perfil del usuario con Context
- src/firebase.js: inicialización de Firebase Authentication y Firestore


