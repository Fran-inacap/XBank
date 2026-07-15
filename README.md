# XBank

Aplicación bancaria en React + Vite + Firebase para practicar autenticación, saldo en tiempo real, transferencias, historial reactivo y personalización visual.

## Índice

- [Requisitos](#requisitos)
- [Variables de entorno](#variables-de-entorno)
- [Ejecución](#ejecución)
- [Testing](#testing)
- [Cobertura](#cobertura)
- [USO DE IA](#uso-de-ia)
- [Notas de pruebas](#notas-de-pruebas)
- [Usuarios de prueba](#usuarios-de-prueba)
- [Funcionalidades implementadas](#funcionalidades-implementadas)
- [Estructura principal](#estructura-principal)

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

## Testing

La suite de pruebas se ejecuta con Vitest y React Testing Library:

```bash
npm test
```

Las pruebas actuales cubren:

- validaciones puras de transferencia con casos parametrizados
- formulario de transferencia con render, error de validación, llamada al servicio y estado de carga
- login con campos vacíos y credenciales inválidas
- historial con orden, distinción de envíos/recepciones, estado vacío y desmontaje con `unsubscribe`

La organización de los tests sigue la estructura sugerida:

- `src/utils/validacionesTransferencia.test.js` para lógica pura
- `src/components/TransferForm.test.jsx` para formulario de transferencia
- `src/components/Login.test.jsx` para login
- `src/components/Historial.test.jsx` para historial
- `src/components/Operaciones.test.jsx` para depósito y retiro

## Cobertura

La cobertura mínima objetivo es de al menos 70% en `src/utils/` y en los componentes testeados.

Resumen actual de cobertura:

- Líneas globales: 72.28%
- `src/App.jsx`: 70.73% de líneas
- `src/utils/validacionesTransferencia.js`: 95.45% de líneas
- Tests ejecutados: 26
- Archivo de reporte HTML generado por Vitest en `coverage/`

## USO DE IA

Se usó IA para acelerar la creación de la batería de tests, la refactorización mínima de la validación pura y la configuración inicial de Vitest.

Se pidió generar tests para:

- validaciones de transferencia
- formulario de transferencia
- login e historial
- caso extra de `unsubscribe` al desmontar
- workflow de GitHub Actions para `npm test`

Ejemplo de test generado y descartado:

- se intentó validar el monto inválido con un valor no numérico dentro del input numérico del formulario, pero el propio navegador bloqueaba el submit antes de llegar a la lógica de negocio; se descartó ese enfoque y se cambió por un valor decimal inválido con submit programático para probar el comportamiento real del componente

## Notas de pruebas

Cada test está escrito con intención de comportamiento visible y no de implementación interna. La batería prioriza independencia, un solo comportamiento por caso y consultas por accesibilidad.

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
- src/components/Login.jsx: formulario de acceso y registro
- src/components/TransferForm.jsx: formulario de transferencias entre usuarios
- src/components/Historial.jsx: vista del historial de movimientos y filtros
- src/App.css: estilos de la interfaz, incluyendo modo oscuro
- src/context/AuthContext.jsx: manejo de sesión y perfil del usuario con Context
- src/utils/validacionesTransferencia.js: reglas puras de validación para transferencias
- src/firebase.js: inicialización de Firebase Authentication y Firestore


