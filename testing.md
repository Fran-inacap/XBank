Este será el documento como referencia para realizar tests unitarios. 
El testing se realizará con Vitest y React Testing Library.
Añadir este archivo a .gitignore

Los tests deben tener las siguientes características:
1. Ser independientes (no depender del resultado de otros tests)
2. Estar estructurados en tres partes: preparación de datos, ejecución de la acción y verificación del resultado.
3. Tener nombres descriptivos
4. Verificar un solo comportamiento.

*COSAS QUE SE DEBEN TESTEAR*
1. Lógica de negocio (cálculos, validaciones, transformaciones)
2. Componentes con interacción del usuario (clicks, inputs, forms)
3. Renderizado condicional (mostrar/ocultar elementos)
4. Custom hooks con lógica
5. Manejo de errores y casos de borde
6. Llamadas a APIs (mockeadas)

*COSAS QUE NO DEBEN TESTEARSE*

1. Detalles de implementación (state interno, nombres de variables)
2. Librerías de terceros
3. Estilos CSS o layout
4. Constantes o configuración estática
5. Código trivial sin lógica (por ejemplo, un componente que solo renderiza props)

*OBLIGATORIO*
1. Los test unitarios NO tocan Firebase real
2. No deben haber conexiones a Firestore
3. No se deben crear usuarios reales en los tests
4. Todo lo que sea Firebase se reemplaza con mocks (vi.mock, vi.fn)
5. Los test no deben depender de internet o de un servicio externo.
6. El componente llama a la función
7. Si debes refactorizar, hazlo.
8. Se debe explicar cada test: qué comportamiento verifica y por qué es importante
9. En el archivo README.md debe haber una sección llamada "USO DE IA".
10. En el archivo README.md, en la sección "USO DE IA", agregar qué se le pidió a los tests y al menos un ejemplo de un test generado que se tuvo que generar o descartar (y por qué).
11. La suite debe corrar con npm test siguiendo el README.md
12. No se debe ocupar it.skip
13. Los tests deben estar en la carpeta "tests"

*TESTS DE LÓGICA PURA: VALIDACIONES DE TRANSFERENCIA*

1. Monto negativo -> rechazado
2. Monto cero -> rechazado
3. Monto no numérico -> rechazado
4. Monto con decimales inválidos -> rechazado
5. Monto mayor al saldo disponible -> rechazado
6. Transferencia a uno mismo -> rechazado
7. Destinatario vacío o con formato de email inválido -> rechazado
8. Monto válido con saldo suficiente -> aceptado

*TESTS DE COMPONENTES: FORMULARIO DE TRANSFERENCIA*

1. Utilizar React Testing Library y userEvent
2. Renderizar los campos
3. Renderizar el botón de enviar
4. Ingreso de monto inválido y transferir -> mostrar mensaje de error. No llamar al servicio de transferencia.
5. Al enviar datos válidos, se llama al servicio (mockeado) solo una vez y con los argumentos correctos.
6. Mientras la transferencia está en curso o en proceso, el botón de transferir queda deshabilitado.

*TEST DE COMPONENTES: LOGIN E HISTORIAL*

1. LOGIN: con campos vacíos no se llama al servicio de autenticación.
2. LOGIN: Si el servicio mockeado rechaza (credenciales inválidas) se muestra un mensaje de error al usuario.
3. HISTORIAL: dado un arreglo de movimientos (Datos de prueba, sin Firestore), el componente los renderiza ordenados del más recientes al más antiguo. 
4. HISTORIAL: dado un arreglo de movimientos (Datos de prueba, sin Firestore), distingue envíos de recepciones.
5. HISTORIAL: dado un arreglo de movimientos (Datos de prueba, sin Firestore), muestra un estado vacío cuando no hay movimientos.

*MOCK DE LA CAPA DE SERVICIOS*

1. Los módulos de src/services/ (o donde tengas tu lógica de Firebase) se mockean con vi.mock. 
2. Se debe demostrar al menos: un mock que resuelve con éxito, un mock que rechaza con error, y verificación de llamadas con toHaveBeenCalledWith. 
3. Ningún archivo de test debe importar la configuración real de Firebase.

*COBERTURA MÍNIMA*

1. La suite debe alcanzar al menos 70% de cobertura de líneas en src/utils/ y en los componentes testeados (formulario de transferencia, login, historial).
3. En el README debes incluir una captura o resumen del reporte de cobertura.

*TEST EXTRA*

1. verificar que al desmontar el componente se llama la función unsubscribe (mockeada). 
2. GitHub Actions: workflow que corre npm test en cada push.
3. Tests parametrizados con it.each para la batería de validaciones.

*REQUISITOS TÉCNICOS*

1. Estructura AAA visible en cada test: preparar, ejecutar, verificar. 
2. Nombres descriptivos que digan comportamiento: it('rechaza transferencias con monto negativo'), no it('test 3').
3. Un comportamiento por test. 
4. Cada test debe poder correr solo y en cualquier orden.
5. Usa beforeEach para resetear mocks (vi.clearAllMocks()), no dependas del estado que dejó el test anterior.
6. Queries de RTL por accesibilidad primero: getByRole, getByLabelText, getByText. El getByTestId es el último recurso, no el primero.
7. Para código asíncrono usa findBy* / waitFor. Nada de setTimeout a mano dentro de un test.

*PROHIBIDO*

1. Tests que se conectan a Firebase real
2. Tests triviales para inflar cobertura: expect(true).toBe(true), testear que un título renderiza un título, o snapshots gigantes sin criterio.
3. Tests que dependen de detalles internos de implementación (leer el estado interno del componente en vez de su comportamiento visible).
4. Tests comentados o con it.skip para "que pase la suite". Si un test falla, se arregla el test o se arregla el código.

*ESTRUCTURA SUGERIDA*

src/
├── utils/
│   ├── validaciones.js
│   └── validaciones.test.js
├── components/
│   ├── TransferForm.jsx
│   ├── TransferForm.test.jsx
│   ├── Login.jsx
│   ├── Login.test.jsx
│   ├── Historial.jsx
│   └── Historial.test.jsx
└── services/
    └── transferencias.js 

