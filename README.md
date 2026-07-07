# XBank

Aplicación bancaria en React + Vite + Firebase para practicar autenticación, saldo en tiempo real, transferencias, historial y diseño moderno.

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

## Usuarios de prueba

Puedes crear cuentas nuevas desde la UI o usar estas credenciales si ya las agregaste a Firestore en la colección users:

1. usuario: fran.gonzalez@xbank.cl
   contraseña: 123456
2. usuario: sergio.perez@xbank.cl
   contraseña: contraseña

## Estructura principal

- src/components/AuthPanel.jsx: login y registro
- src/components/Dashboard.jsx: saldo, transferencias, depósito/retiro e historial
- src/context/AuthContext.jsx: estado global con useReducer + useContext
- src/services/bankService.js: acceso a Firestore y Firebase Auth


