La aplicación es un prototipo de un mini banco digital. La interfaz debe ser simple, correcta y reactiva.
Las líneas de código deben estar justificadas con comentarios en español, ya sea explicando qué se está usando y/o por qué.

*OBJETIVOS DE APRENDIZAJE*

- Construir en React usando componentes funcionales y hooks (useState, useEffect. Opcionalmente se puede usar useContext o useReducer).
- Aplicar buenas prácticas de manejo de eventos: handlers nombrados, prevención de comportamiento por defecto, validación antes de ejecutar acciones.
- Aplicar el paradigma reactivo: la UI se deriva del estado, y el estado se sincroniza con Firestore mediante onSnapshot.
- Integrar Firebase Authentication y Cloud Firestore en una aplicación real
- Manejar estados de carga, error y datos vacíos de forma explícita en la interfaz.

*DESCRIPCIÓN DEL PROYECTO*

Construir XBank: una banca digital básica donde un usuario puede iniciar sesión, ver su saldo, transferir dinero a otros usuarios y revisar su historial de movimientos.

*REQUISITOS TÉCNICOS*

1. Manejo de eventos
Handlers con nombre y responsabilidad clara (handleTransferSubmit, handleAmountChange), no funciones anónimas gigantes dentro del JSX.
Formularios controlados: el valor de cada input vive en el estado, no en el DOM.
event.preventDefault() en el submit de formularios. Si tu app recarga la página al transferir, algo hiciste mal.
Deshabilitar el botón de enviar mientras la operación está en curso (evitar doble submit = doble transferencia).
Validar antes de tocar Firestore. El usuario debe recibir feedback claro de qué está mal (mensaje visible, no solo console.log).

2. Programación reactiva
La UI es una función del estado: nada de manipular el DOM a mano (document.getElementById está prohibido dentro de componentes).
Saldo e historial se suscriben con onSnapshot, no con getDoc en un intervalo ni con botones de "actualizar".
Toda suscripción creada en un useEffect debe retornar su función de limpieza (unsubscribe). Fugas de memoria = descuento.
Arreglos de dependencias correctos en useEffect. Ni [] mágicos que esconden bugs, ni dependencias que generan loops infinitos.
Estados de carga y error explícitos: mientras llegan los datos se muestra un indicador, y si algo falla el usuario lo sabe.

3. Buenas prácticas generales
Componentes pequeños y con una responsabilidad. Un App.jsx de 400 líneas no es un componente, es un grito de auxilio.
Separar la lógica de Firebase en un módulo propio (ej. src/services/ o src/firebase/): los componentes no deberían importar Firestore directo por todos lados.
Nombres descriptivos en español o inglés, pero consistentes. Nada de data2, aux, cosa.
Las credenciales de Firebase van en variables de entorno (.env), y el .env va en el .gitignore. Incluye un .env.example con las claves vacías para que el profesor sepa qué configurar.
README con instrucciones para correr el proyecto y las credenciales de 2 usuarios de prueba.

4. Modelo de datos sugerido
users/{uid}        → { nombre, email, saldo }
movimientos/{id}   → { emisorUid, receptorUid, monto, fecha, descripcion }

*REQUISITOS FUNCIONALES*

1. Registro e inicio de sesión con Firebase Authentication (email/contraseña). Un usuario no autenticado no puede ver nada más que el login/registro. Al registrarse, se crea su cuenta en Firestore con un saldo inicial de $100.000.

2. Dashboard con saldo en tiempo real
Al entrar, el usuario ve su nombre y su saldo actual. El saldo se lee con onSnapshot: si cambia en Firestore (por ejemplo, porque otro usuario le transfirió).

3. Transferencias
Formulario para transferir a otro usuario (por email o identificador). Validaciones mínimas: monto mayor a 0, saldo suficiente, no transferirse a sí mismo, destinatario existente. La transferencia descuenta al emisor, abona al receptor y registra el movimiento.

4. Historial de movimientos
Lista de movimientos del usuario (enviados y recibidos), ordenada del más reciente al más antiguo, también en tiempo real. Cada movimiento muestra fecha, contraparte, monto y tipo (envío/recepción).

5. Cerrar sesión
Botón de logout que limpia el estado y devuelve al login. Ojo: al cerrar sesión deben cancelarse las suscripciones activas.

6. Depósito/retiro simulado (botones que modifican el saldo con validación).

7. Filtro o búsqueda en el historial (por tipo, fecha o contraparte).

8. Modo oscuro persistente o diseño destacable (que se note intención, no solo Bootstrap por defecto).

9. Uso de useReducer + useContext para el estado global de la sesión.

*IMPORTANTE*

- No dejar nada como la ApiKey disponible.
- Antes de aplicar cambios, debes validar conmigo lo que se debe hacer. Los cambios solo deben hacerse previa autorización explícita (pregunta "¿quieres aplicar estos cambios?" Solo un sí como respuesta permite continuar).
- Aplicar los requisitos funcionales de uno en uno. Una vez que uno esté listo y aprobado por mí (preguntar "estás conforme con el cambio realizado?") se puede continuar con el siguiente.
- Los cambios deben aplicarse solo a App.jsx, App.css y firebase.js. Si estimas que se debe realizar un cambio en otro archivo, debes preguntarme para confirmar
- Modificar el README.md a medida que se vayan implementando cambios. Si falta información de cambios pasados, agregar. Debe estar en español.


