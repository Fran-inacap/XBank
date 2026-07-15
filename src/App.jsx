import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import TransferForm from "./components/TransferForm";
import Historial from "./components/Historial";
import { validarTransferencia } from "./utils/validacionesTransferencia";
import "./App.css";

const SALDO_INICIAL = 100000;

function App() {
  const { user: usuario, profile: perfil, loading: cargando, profileLoading: perfilCargando, profileError: perfilErrorContext, error: sessionError, login, register, logout: logoutAuth, clearError, updateProfile } = useAuth();
  // Estado derivado de Firestore para usuarios y movimientos visibles en el dashboard.
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [usuariosPorId, setUsuariosPorId] = useState({});
  const [mostrarFormularioTransferencia, setMostrarFormularioTransferencia] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarFormularioDeposito, setMostrarFormularioDeposito] = useState(false);
  const [mostrarFormularioRetiro, setMostrarFormularioRetiro] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [movimientosCargando, setMovimientosCargando] = useState(true);
  const [movimientosError, setMovimientosError] = useState("");

  // Estado de formularios controlados para autenticación y operaciones bancarias.
  const [iniciarSesion, setIniciarSesion] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [destinatarioId, setDestinatarioId] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const [descripcionTransferencia, setDescripcionTransferencia] = useState("");
  const [montoDeposito, setMontoDeposito] = useState("");
  const [montoRetiro, setMontoRetiro] = useState("");

  // Estado de filtros para que el historial se derive de la misma colección sin consultas extra.
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroMes, setFiltroMes] = useState("todos");
  const [filtroContraparte, setFiltroContraparte] = useState("todos");

  // Estado de feedback para mostrar validaciones y resultados en la UI.
  const [error, setError] = useState("");
  const [transferenciaError, setTransferenciaError] = useState("");
  const [transferenciaExito, setTransferenciaExito] = useState("");
  const [depositoError, setDepositoError] = useState("");
  const [depositoExito, setDepositoExito] = useState("");
  const [retiroError, setRetiroError] = useState("");
  const [retiroExito, setRetiroExito] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [transferenciaProcesando, setTransferenciaProcesando] = useState(false);
  const [depositoProcesando, setDepositoProcesando] = useState(false);
  const [retiroProcesando, setRetiroProcesando] = useState(false);

  // El tema se inicializa desde localStorage para respetar la última preferencia del usuario.
  const [modoOscuro, setModoOscuro] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem("xbank-theme") === "dark";
  });

  useEffect(() => {
    // Se persiste el tema para mantener la preferencia del usuario entre recargas.
    document.body.classList.toggle("dark", modoOscuro);
    localStorage.setItem("xbank-theme", modoOscuro ? "dark" : "light");
  }, [modoOscuro]);

  useEffect(() => {
    // Se obtiene la lista de usuarios disponibles para transferir desde Firestore.
    if (!usuario?.uid) {
      setUsuariosDisponibles([]);
      setUsuariosPorId({});
      setDestinatarioId("");
      return;
    }

    const usuariosRef = collection(db, "users");
    const unsubscribeUsuarios = onSnapshot(
      usuariosRef,
      (snapshot) => {
        const usuarios = snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
        const mapaUsuarios = usuarios.reduce((acumulador, usuarioActual) => {
          acumulador[usuarioActual.id] = usuarioActual;
          return acumulador;
        }, {});
        const otrosUsuarios = usuarios.filter((usuarioDisponible) => usuarioDisponible.id !== usuario.uid);

        setUsuariosPorId(mapaUsuarios);
        setUsuariosDisponibles(otrosUsuarios);
        setDestinatarioId((valorActual) => {
          if (valorActual && otrosUsuarios.some((usuarioDisponible) => usuarioDisponible.id === valorActual)) {
            return valorActual;
          }

          return otrosUsuarios[0]?.id || "";
        });
      },
      (snapshotError) => {
        console.error("No se pudo cargar la lista de usuarios:", snapshotError);
      }
    );

    return () => unsubscribeUsuarios();
  }, [usuario?.uid]);

  useEffect(() => {
    // Se escucha la colección de movimientos para mostrar el historial en tiempo real.
    if (!usuario?.uid) {
      setMovimientos([]);
      setMovimientosCargando(false);
      setMovimientosError("");
      return;
    }

    setMovimientosCargando(true);
    setMovimientosError("");

    const movimientosRef = collection(db, "movimientos");
    const unsubscribeMovimientos = onSnapshot(
      movimientosRef,
      (snapshot) => {
        const movimientosUsuario = snapshot.docs
          .map((documento) => ({ id: documento.id, ...documento.data() }))
          .filter((movimiento) => movimiento.emisorUid === usuario.uid || movimiento.receptorUid === usuario.uid)
          .sort((a, b) => {
            const fechaA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha || 0);
            const fechaB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha || 0);
            return fechaB - fechaA;
          });

        setMovimientos(movimientosUsuario);
        setMovimientosCargando(false);
      },
      (snapshotError) => {
        console.error("No se pudo cargar el historial de movimientos:", snapshotError);
        setMovimientosError("No se pudo cargar el historial de movimientos.");
        setMovimientosCargando(false);
      }
    );

    return () => unsubscribeMovimientos();
  }, [usuario?.uid]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    // Se valida antes de tocar Firebase para evitar llamadas innecesarias y dar feedback inmediato.

    if (!email.trim() || !password) {
      setError("Completa tu correo y contraseña.");
      return;
    }

    if (!iniciarSesion && !nombre.trim()) {
      setError("Ingresa tu nombre para crear la cuenta.");
      return;
    }

    setError("");
    setProcesando(true);

    try {
      let credencial;

      if (iniciarSesion) {
        credencial = await login(email.trim(), password);
      } else {
        credencial = await register(email.trim(), password, nombre);
        setIniciarSesion(true);
      }

      setEmail("");
      setPassword("");
      setNombre("");
      setError("");
      console.info("Autenticación completada", credencial.user.email);
    } catch (authError) {
      const mensaje = authError?.code === "auth/invalid-credential" || authError?.code === "auth/user-not-found" || authError?.code === "auth/wrong-password"
        ? "Usuario y/o contraseña incorrectos"
        : authError.message || "No se pudo completar la operación.";

      setError(mensaje);
    } finally {
      setProcesando(false);
    }
  };

  const handleLogout = async () => {
    await logoutAuth();
  };

  const resetForms = () => {
    // Se limpian los campos al cambiar entre login y registro para no mezclar estados anteriores.
    setEmail("");
    setPassword("");
    setNombre("");
    setError("");
    clearError();
    setIniciarSesion((valor) => !valor);
  };

  const handleAmountChange = (event) => {
    setMontoTransferencia(event.target.value);

    if (transferenciaError) {
      setTransferenciaError("");
    }
  };

  const handleDepositoAmountChange = (event) => {
    setMontoDeposito(event.target.value);

    if (depositoError) {
      setDepositoError("");
    }
  };

  const handleRetiroAmountChange = (event) => {
    setMontoRetiro(event.target.value);

    if (retiroError) {
      setRetiroError("");
    }
  };

  const handleDepositoSubmit = async () => {
    const monto = Number(montoDeposito);

    if (!Number.isFinite(monto) || monto <= 0) {
      setDepositoError("Ingresa un monto válido mayor a cero.");
      return;
    }

    if (!perfil?.saldo && perfil?.saldo !== 0) {
      setDepositoError("Aún no se cargó tu saldo. Intenta de nuevo en unos segundos.");
      return;
    }

    const confirmado = window.confirm(`¿Deseas confirmar un depósito de ${formatearSaldo(monto)} en tu cuenta?`);

    if (!confirmado) {
      return;
    }

    setDepositoError("");
    setDepositoExito("");
    setDepositoProcesando(true);

    try {
      // La transacción asegura que saldo e historial se actualicen como una sola operación atómica.
      const usuarioRef = doc(db, "users", usuario.uid);
      const movimientoRef = doc(collection(db, "movimientos"));

      await runTransaction(db, async (transaccion) => {
        const usuarioSnapshot = await transaccion.get(usuarioRef);

        if (!usuarioSnapshot.exists()) {
          throw new Error("Tu perfil ya no está disponible.");
        }

        const saldoActual = Number(usuarioSnapshot.data().saldo ?? 0);
        transaccion.update(usuarioRef, { saldo: saldoActual + monto });
        // Se registra el depósito para que también aparezca en el historial filtrable.
        transaccion.set(movimientoRef, {
          emisorUid: "sistema",
          receptorUid: usuario.uid,
          tipo: "deposito",
          monto,
          descripcion: "Depósito en cuenta propia",
          fecha: serverTimestamp(),
        });
      });

      updateProfile((perfilActual) => {
        if (!perfilActual) {
          return perfilActual;
        }

        return {
          ...perfilActual,
          saldo: Number(perfilActual.saldo ?? 0) + monto,
        };
      });
      setMontoDeposito("");
      setDepositoExito("Depósito realizado con éxito.");
    } catch (operacionCatchError) {
      setDepositoError(operacionCatchError.message || "No se pudo completar la operación.");
    } finally {
      setDepositoProcesando(false);
    }
  };

  const handleRetiroSubmit = async () => {
    const monto = Number(montoRetiro);

    if (!Number.isFinite(monto) || monto <= 0) {
      setRetiroError("Ingresa un monto válido mayor a cero.");
      return;
    }

    if (!perfil?.saldo && perfil?.saldo !== 0) {
      setRetiroError("Aún no se cargó tu saldo. Intenta de nuevo en unos segundos.");
      return;
    }

    if (monto > Number(perfil.saldo)) {
      setRetiroError("No tienes saldo suficiente para realizar este retiro.");
      return;
    }

    const confirmado = window.confirm(`¿Deseas confirmar un retiro de ${formatearSaldo(monto)} de tu cuenta?`);

    if (!confirmado) {
      return;
    }

    setRetiroError("");
    setRetiroExito("");
    setRetiroProcesando(true);

    try {
      // La transacción evita inconsistencias si el saldo cambia mientras se procesa el retiro.
      const usuarioRef = doc(db, "users", usuario.uid);
      const movimientoRef = doc(collection(db, "movimientos"));

      await runTransaction(db, async (transaccion) => {
        const usuarioSnapshot = await transaccion.get(usuarioRef);

        if (!usuarioSnapshot.exists()) {
          throw new Error("Tu perfil ya no está disponible.");
        }

        const saldoActual = Number(usuarioSnapshot.data().saldo ?? 0);

        if (saldoActual < monto) {
          throw new Error("No tienes saldo suficiente para realizar este retiro.");
        }

        transaccion.update(usuarioRef, { saldo: saldoActual - monto });
        // Se registra el retiro para mantener el historial consistente con el saldo.
        transaccion.set(movimientoRef, {
          emisorUid: usuario.uid,
          receptorUid: "sistema",
          tipo: "retiro",
          monto,
          descripcion: "Retiro de cuenta propia",
          fecha: serverTimestamp(),
        });
      });

      updateProfile((perfilActual) => {
        if (!perfilActual) {
          return perfilActual;
        }

        return {
          ...perfilActual,
          saldo: Number(perfilActual.saldo ?? 0) - monto,
        };
      });
      setMontoRetiro("");
      setRetiroExito("Retiro realizado con éxito.");
    } catch (operacionCatchError) {
      setRetiroError(operacionCatchError.message || "No se pudo completar la operación.");
    } finally {
      setRetiroProcesando(false);
    }
  };

  const handleTransferToggle = () => {
    setMostrarFormularioTransferencia((valorActual) => !valorActual);
    setTransferenciaError("");
    setTransferenciaExito("");
  };

  const handleHistorialToggle = () => {
    setMostrarHistorial((valorActual) => !valorActual);
    setMovimientosError("");
  };

  const handleDepositoToggle = () => {
    // Cada operación se muestra de forma independiente para separar depósito y retiro.
    setMostrarFormularioDeposito((valorActual) => !valorActual);
    setDepositoError("");
    setDepositoExito("");
  };

  const handleRetiroToggle = () => {
    // Cada operación se muestra de forma independiente para separar depósito y retiro.
    setMostrarFormularioRetiro((valorActual) => !valorActual);
    setRetiroError("");
    setRetiroExito("");
  };

  const handleTransferSubmit = async (event) => {
    event.preventDefault();
    setTransferenciaError("");
    setTransferenciaExito("");

    // La validación local protege reglas básicas del negocio antes de descontar o abonar saldo.

    if (!destinatarioId) {
      setTransferenciaError("Selecciona a un destinatario para transferir.");
      return;
    }

    const destinatarioSeleccionado = usuariosPorId[destinatarioId];
    const validacionTransferencia = validarTransferencia({
      montoIngresado: montoTransferencia,
      saldoDisponible: perfil?.saldo,
      destinatarioEmail: destinatarioSeleccionado?.email,
      usuarioEmail: usuario?.email,
    });

    if (!validacionTransferencia.valido) {
      setTransferenciaError(validacionTransferencia.error);
      return;
    }

    const monto = validacionTransferencia.monto;

    setTransferenciaProcesando(true);

    try {
      // Se actualizan ambos usuarios y el movimiento en una sola transacción para no dejar saldos desfasados.
      const emisorRef = doc(db, "users", usuario.uid);
      const receptorRef = doc(db, "users", destinatarioId);
      const movimientoRef = doc(collection(db, "movimientos"));

      await runTransaction(db, async (transaccion) => {
        const emisorSnapshot = await transaccion.get(emisorRef);
        const receptorSnapshot = await transaccion.get(receptorRef);

        if (!emisorSnapshot.exists()) {
          throw new Error("Tu perfil ya no está disponible.");
        }

        if (!receptorSnapshot.exists()) {
          throw new Error("El destinatario ya no está disponible.");
        }

        const saldoEmisorActual = Number(emisorSnapshot.data().saldo ?? 0);
        const saldoReceptorActual = Number(receptorSnapshot.data().saldo ?? 0);

        if (saldoEmisorActual < monto) {
          throw new Error("No tienes saldo suficiente para realizar esta transferencia.");
        }

        transaccion.update(emisorRef, { saldo: saldoEmisorActual - monto });
        transaccion.update(receptorRef, { saldo: saldoReceptorActual + monto });
        transaccion.set(movimientoRef, {
          emisorUid: usuario.uid,
          receptorUid: destinatarioId,
          monto,
          descripcion: descripcionTransferencia.trim() || "Transferencia",
          fecha: serverTimestamp(),
        });
      });

      updateProfile((perfilActual) => {
        if (!perfilActual) {
          return perfilActual;
        }

        return {
          ...perfilActual,
          saldo: Number(perfilActual.saldo ?? 0) - monto,
        };
      });
      setMontoTransferencia("");
      setDescripcionTransferencia("");
      setTransferenciaExito("Transferencia realizada con éxito.");
    } catch (transferError) {
      setTransferenciaError(transferError.message || "No se pudo completar la transferencia.");
    } finally {
      setTransferenciaProcesando(false);
    }
  };

  const formatearSaldo = (valor) => {
    const numero = Number(valor ?? 0);
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(numero);
  };

  const formatearFechaHora = (fecha) => {
    const fechaValor = fecha?.toDate ? fecha.toDate() : new Date(fecha || 0);

    if (Number.isNaN(fechaValor.getTime())) {
      return "Fecha no disponible";
    }

    // Se separan fecha y hora para cumplir con el formato largo solicitado y forzar reloj de 24 horas.
    const fechaFormateada = new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(fechaValor);

    const horaFormateada = new Intl.DateTimeFormat("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(fechaValor);

    return `${fechaFormateada} · ${horaFormateada}`;
  };

  const obtenerContraparte = (movimiento) => {
    // Depósitos y retiros no tienen otro usuario real, por eso se muestran como cuenta propia.
    if (movimiento.tipo === "deposito" || movimiento.tipo === "retiro") {
      return "Cuenta propia";
    }

    const uidContraparte = movimiento.emisorUid === usuario?.uid ? movimiento.receptorUid : movimiento.emisorUid;
    const usuarioContraparte = usuariosPorId[uidContraparte];

    if (usuarioContraparte?.nombre) {
      return usuarioContraparte.nombre;
    }

    if (usuarioContraparte?.email) {
      return usuarioContraparte.email;
    }

    return "Usuario externo";
  };

  const esMovimientoNegativo = (movimiento) => {
    // Se centraliza el signo para que transferencias, retiros y depósitos usen la misma regla en historial y filtros.
    if (movimiento.tipo === "deposito") {
      return false;
    }

    if (movimiento.tipo === "retiro") {
      return true;
    }

    return movimiento.emisorUid === usuario?.uid;
  };

  const obtenerEtiquetaMovimiento = (movimiento) => {
    if (movimiento.tipo === "deposito") {
      return "Depósito";
    }

    if (movimiento.tipo === "retiro") {
      return "Retiro";
    }

    return esMovimientoNegativo(movimiento) ? "Envío" : "Recepción";
  };

  const obtenerTipoFiltroMovimiento = (movimiento) => {
    // Se traduce cada movimiento al valor exacto que usa el select del filtro por tipo.
    if (movimiento.tipo === "deposito") {
      return "deposito";
    }

    if (movimiento.tipo === "retiro") {
      return "retiro";
    }

    return esMovimientoNegativo(movimiento) ? "envio" : "recepcion";
  };

  const movimientosFiltrados = movimientos.filter((movimiento) => {
    // Los filtros se aplican en memoria porque el historial ya está sincronizado en tiempo real.
    const tipoMovimiento = obtenerTipoFiltroMovimiento(movimiento);
    const fechaMovimiento = movimiento.fecha?.toDate ? movimiento.fecha.toDate() : new Date(movimiento.fecha || 0);
    const mesMovimiento = fechaMovimiento.getMonth() + 1;
    const nombreContraparte = obtenerContraparte(movimiento);

    if (filtroTipo !== "todos" && tipoMovimiento !== filtroTipo) {
      return false;
    }

    if (filtroMes !== "todos") {
      const mesSeleccionado = Number(filtroMes);
      if (mesMovimiento !== mesSeleccionado) {
        return false;
      }
    }

    if (filtroContraparte !== "todos" && nombreContraparte !== filtroContraparte) {
      return false;
    }

    return true;
  });

  const opcionesMeses = Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1),
    label: new Date(2026, index, 1).toLocaleString("es-CL", { month: "long" }),
  }));

  const opcionesContraparte = Array.from(
    new Set(movimientos.map((movimiento) => obtenerContraparte(movimiento)))
  ).sort();

  if (cargando) {
    return <div className="app loading">Cargando...</div>;
  }

  if (!usuario) {
    return (
      <Login
        modoOscuro={modoOscuro}
        iniciarSesion={iniciarSesion}
        nombre={nombre}
        email={email}
        password={password}
        procesando={procesando}
        error={error}
        sessionError={sessionError}
        onSubmit={handleAuthSubmit}
        onToggleModo={resetForms}
        onNombreChange={setNombre}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
      />
    );
  }

  return (
    <div className={`app ${modoOscuro ? "app-dark" : ""}`}>
      <div className={`dashboard-card ${modoOscuro ? "card-dark" : ""}`}>
        {/* Con sesión activa se habilitan saldo, operaciones y el historial en tiempo real. */}
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Bienvenido a XBank</p>
            <h1>{perfil?.nombre || usuario.email}</h1>
          </div>
          <div className="dashboard-actions">
            <button type="button" className={`theme-toggle ${modoOscuro ? "theme-toggle-dark" : ""}`} onClick={() => setModoOscuro((valorActual) => !valorActual)}>
              {modoOscuro ? "☀️ Claro" : "🌙 Oscuro"}
            </button>
            <button type="button" className="secondary-btn" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="saldo-card">
          <p className="saldo-label">Saldo actual</p>

          {perfilCargando ? (
            <p className="saldo-value">Cargando saldo...</p>
          ) : perfilErrorContext && !perfil ? (
            <p className="feedback feedback-error">{perfilErrorContext}</p>
          ) : (
            <>
              <p className="saldo-value">{formatearSaldo(perfil?.saldo)}</p>
            </>
          )}
        </div>

        <TransferForm
          usuariosDisponibles={usuariosDisponibles}
          mostrarFormularioTransferencia={mostrarFormularioTransferencia}
          destinatarioId={destinatarioId}
          onToggle={handleTransferToggle}
          onDestinatarioChange={setDestinatarioId}
          montoTransferencia={montoTransferencia}
          onMontoChange={setMontoTransferencia}
          descripcionTransferencia={descripcionTransferencia}
          onDescripcionChange={setDescripcionTransferencia}
          transferenciaProcesando={transferenciaProcesando}
          transferenciaError={transferenciaError}
          transferenciaExito={transferenciaExito}
          onSubmit={handleTransferSubmit}
        />

        <div className="operation-card">
          <div className="transfer-header">
            <h2>Depósito y retiro</h2>
          </div>

          <div className="operation-grid">
            <div className="operation-section">
              <div className="transfer-header">
                <h3>Depositar dinero</h3>
                <button type="button" className="secondary-btn" onClick={handleDepositoToggle}>
                  {mostrarFormularioDeposito ? "Ocultar" : "Depositar"}
                </button>
              </div>

              {mostrarFormularioDeposito && (
                <div className="transfer-form">
                  <label className="transfer-field">
                    Monto
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={montoDeposito}
                      onChange={handleDepositoAmountChange}
                      placeholder="5000"
                    />
                  </label>

                  <div className="operation-actions">
                    <button type="button" className="secondary-btn" onClick={handleDepositoSubmit} disabled={depositoProcesando || !montoDeposito}>
                      {depositoProcesando ? "Procesando..." : "Confirmar depósito"}
                    </button>
                  </div>

                  {depositoError && <p className="feedback feedback-error">{depositoError}</p>}
                  {depositoExito && <p className="feedback">{depositoExito}</p>}
                </div>
              )}
            </div>

            <div className="operation-section">
              <div className="transfer-header">
                <h3>Retirar dinero</h3>
                <button type="button" className="secondary-btn" onClick={handleRetiroToggle}>
                  {mostrarFormularioRetiro ? "Ocultar" : "Retirar"}
                </button>
              </div>

              {mostrarFormularioRetiro && (
                <div className="transfer-form">
                  <label className="transfer-field">
                    Monto
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={montoRetiro}
                      onChange={handleRetiroAmountChange}
                      placeholder="5000"
                    />
                  </label>

                  <div className="operation-actions">
                    <button type="button" className="secondary-btn" onClick={handleRetiroSubmit} disabled={retiroProcesando || !montoRetiro}>
                      {retiroProcesando ? "Procesando..." : "Confirmar retiro"}
                    </button>
                  </div>

                  {retiroError && <p className="feedback feedback-error">{retiroError}</p>}
                  {retiroExito && <p className="feedback">{retiroExito}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        <Historial
          mostrarHistorial={mostrarHistorial}
          onToggle={handleHistorialToggle}
          movimientosCargando={movimientosCargando}
          movimientosError={movimientosError}
          movimientos={movimientos}
          movimientosFiltrados={movimientosFiltrados}
          filtroTipo={filtroTipo}
          onFiltroTipoChange={setFiltroTipo}
          filtroMes={filtroMes}
          onFiltroMesChange={setFiltroMes}
          filtroContraparte={filtroContraparte}
          onFiltroContraparteChange={setFiltroContraparte}
          opcionesMeses={opcionesMeses}
          opcionesContraparte={opcionesContraparte}
          formatearFechaHora={formatearFechaHora}
          formatearSaldo={formatearSaldo}
          obtenerContraparte={obtenerContraparte}
          esMovimientoNegativo={esMovimientoNegativo}
        />
      </div>
    </div>
  );
}

export default App;