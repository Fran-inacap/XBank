import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./context/AuthContext";
import "./App.css";

const SALDO_INICIAL = 100000;

function App() {
  const { user: usuario, profile: perfil, loading: cargando, profileLoading: perfilCargando, profileError: perfilErrorContext, error: sessionError, login, register, logout: logoutAuth, clearError, updateProfile } = useAuth();
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [usuariosPorId, setUsuariosPorId] = useState({});
  const [mostrarFormularioTransferencia, setMostrarFormularioTransferencia] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [movimientosCargando, setMovimientosCargando] = useState(true);
  const [movimientosError, setMovimientosError] = useState("");
  const [iniciarSesion, setIniciarSesion] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [destinatarioId, setDestinatarioId] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const [descripcionTransferencia, setDescripcionTransferencia] = useState("");
  const [montoOperacion, setMontoOperacion] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroMes, setFiltroMes] = useState("todos");
  const [filtroContraparte, setFiltroContraparte] = useState("todos");
  const [error, setError] = useState("");
  const [transferenciaError, setTransferenciaError] = useState("");
  const [transferenciaExito, setTransferenciaExito] = useState("");
  const [operacionError, setOperacionError] = useState("");
  const [operacionExito, setOperacionExito] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [transferenciaProcesando, setTransferenciaProcesando] = useState(false);
  const [operacionProcesando, setOperacionProcesando] = useState(false);
  const [modoOscuro, setModoOscuro] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem("xbank-theme") === "dark";
  });

  useEffect(() => {
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

  const handleOperacionAmountChange = (event) => {
    setMontoOperacion(event.target.value);

    if (operacionError) {
      setOperacionError("");
    }
  };

  const handleOperacionSubmit = async (tipo) => {
    const monto = Number(montoOperacion);

    if (!Number.isFinite(monto) || monto <= 0) {
      setOperacionError("Ingresa un monto válido mayor a cero.");
      return;
    }

    if (!perfil?.saldo && perfil?.saldo !== 0) {
      setOperacionError("Aún no se cargó tu saldo. Intenta de nuevo en unos segundos.");
      return;
    }

    if (tipo === "retiro" && monto > Number(perfil.saldo)) {
      setOperacionError("No tienes saldo suficiente para realizar este retiro.");
      return;
    }

    const mensajeConfirmacion = tipo === "deposito"
      ? `¿Deseas confirmar un depósito de ${formatearSaldo(monto)} en tu cuenta?`
      : `¿Deseas confirmar un retiro de ${formatearSaldo(monto)} de tu cuenta?`;
    const confirmado = window.confirm(mensajeConfirmacion);

    if (!confirmado) {
      return;
    }

    setOperacionError("");
    setOperacionExito("");
    setOperacionProcesando(true);

    try {
      const usuarioRef = doc(db, "users", usuario.uid);

      await runTransaction(db, async (transaccion) => {
        const usuarioSnapshot = await transaccion.get(usuarioRef);

        if (!usuarioSnapshot.exists()) {
          throw new Error("Tu perfil ya no está disponible.");
        }

        const saldoActual = Number(usuarioSnapshot.data().saldo ?? 0);
        const saldoNuevo = tipo === "deposito" ? saldoActual + monto : saldoActual - monto;

        if (tipo === "retiro" && saldoActual < monto) {
          throw new Error("No tienes saldo suficiente para realizar este retiro.");
        }

        transaccion.update(usuarioRef, { saldo: saldoNuevo });
      });

      updateProfile((perfilActual) => {
        if (!perfilActual) {
          return perfilActual;
        }

        const saldoActual = Number(perfilActual.saldo ?? 0);
        const saldoNuevo = tipo === "deposito" ? saldoActual + monto : saldoActual - monto;

        return {
          ...perfilActual,
          saldo: saldoNuevo,
        };
      });
      setMontoOperacion("");
      setOperacionExito(tipo === "deposito" ? "Depósito realizado con éxito." : "Retiro realizado con éxito.");
    } catch (operacionCatchError) {
      setOperacionError(operacionCatchError.message || "No se pudo completar la operación.");
    } finally {
      setOperacionProcesando(false);
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

  const handleTransferSubmit = async (event) => {
    event.preventDefault();
    setTransferenciaError("");
    setTransferenciaExito("");

    if (!destinatarioId) {
      setTransferenciaError("Selecciona a un destinatario para transferir.");
      return;
    }

    const monto = Number(montoTransferencia);

    if (!Number.isFinite(monto) || monto <= 0) {
      setTransferenciaError("Ingresa un monto válido mayor a cero.");
      return;
    }

    if (!perfil?.saldo && perfil?.saldo !== 0) {
      setTransferenciaError("Aún no se cargó tu saldo. Intenta de nuevo en unos segundos.");
      return;
    }

    if (monto > Number(perfil.saldo)) {
      setTransferenciaError("No tienes saldo suficiente para realizar esta transferencia.");
      return;
    }

    if (destinatarioId === usuario.uid) {
      setTransferenciaError("No puedes transferirte dinero a ti mismo.");
      return;
    }

    setTransferenciaProcesando(true);

    try {
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

    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(fechaValor);
  };

  const obtenerContraparte = (movimiento) => {
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

  const movimientosFiltrados = movimientos.filter((movimiento) => {
    const esEnvio = movimiento.emisorUid === usuario?.uid;
    const fechaMovimiento = movimiento.fecha?.toDate ? movimiento.fecha.toDate() : new Date(movimiento.fecha || 0);
    const mesMovimiento = fechaMovimiento.getMonth() + 1;
    const nombreContraparte = obtenerContraparte(movimiento);

    if (filtroTipo !== "todos" && (filtroTipo === "envio" ? !esEnvio : esEnvio)) {
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
      <div className={`app ${modoOscuro ? "app-dark" : ""}`}>
        <form className={`auth-card ${modoOscuro ? "card-dark" : ""}`} onSubmit={handleAuthSubmit}>
          <div className="auth-header">
            <h1>XBank</h1>
            <p>Gestiona tu dinero con seguridad</p>
          </div>

          {!iniciarSesion && (
            <label>
              Nombre completo
              <input value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Juan Pérez" required />
            </label>
          )}

          <label>
            Correo electrónico
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@ejemplo.com" required />
          </label>

          <label>
            Contraseña
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" required />
          </label>

          <button type="submit" disabled={procesando}>
            {procesando ? "Procesando..." : iniciarSesion ? "Iniciar sesión" : "Crear cuenta"}
          </button>

          <button type="button" className="secondary-btn" onClick={resetForms}>
            {iniciarSesion ? "Crear una cuenta" : "Ya tengo cuenta"}
          </button>

          {(error || sessionError) && <p className="feedback feedback-error">{error || sessionError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className={`app ${modoOscuro ? "app-dark" : ""}`}>
      <div className={`dashboard-card ${modoOscuro ? "card-dark" : ""}`}>
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
          ) : perfilErrorContext ? (
            <p className="feedback feedback-error">{perfilErrorContext}</p>
          ) : (
            <>
              <p className="saldo-value">{formatearSaldo(perfil?.saldo)}</p>
              <p className="saldo-subtitle">Se actualiza automáticamente desde Firestore.</p>
            </>
          )}
        </div>

        <div className="transfer-card">
          <div className="transfer-header">
            <h2>Transferir dinero</h2>
            <button type="button" className="secondary-btn" onClick={handleTransferToggle}>
              {mostrarFormularioTransferencia ? "Ocultar" : "Transferir"}
            </button>
          </div>

          {mostrarFormularioTransferencia && (
            <form className="transfer-form" onSubmit={handleTransferSubmit}>
              <label className="transfer-field">
                Destinatario
                {usuariosDisponibles.length > 0 ? (
                  <select value={destinatarioId} onChange={(event) => setDestinatarioId(event.target.value)}>
                    <option value="">Selecciona un usuario</option>
                    {usuariosDisponibles.map((usuarioDisponible) => (
                      <option key={usuarioDisponible.id} value={usuarioDisponible.id}>
                        {usuarioDisponible.nombre} ({usuarioDisponible.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="transfer-empty">No hay otros usuarios disponibles para transferir.</p>
                )}
              </label>

              <label className="transfer-field">
                Monto
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={montoTransferencia}
                  onChange={handleAmountChange}
                  placeholder="10000"
                />
              </label>

              <label className="transfer-field">
                Descripción
                <input
                  type="text"
                  value={descripcionTransferencia}
                  onChange={(event) => setDescripcionTransferencia(event.target.value)}
                  placeholder="Pago por servicios"
                />
              </label>

              <div className="transfer-actions">
                <button type="submit" disabled={transferenciaProcesando || !destinatarioId || !montoTransferencia}>
                  {transferenciaProcesando ? "Procesando..." : "Confirmar transferencia"}
                </button>
              </div>

              {transferenciaError && <p className="feedback feedback-error">{transferenciaError}</p>}
              {transferenciaExito && <p className="feedback">{transferenciaExito}</p>}
            </form>
          )}
        </div>

        <div className="operation-card">
          <div className="transfer-header">
            <h2>Depósito y retiro</h2>
          </div>

          <p className="transfer-empty">Gestiona tu saldo con operaciones simuladas y confirmación.</p>

          <label className="transfer-field">
            Monto
            <input
              type="number"
              min="1"
              step="1"
              value={montoOperacion}
              onChange={handleOperacionAmountChange}
              placeholder="5000"
            />
          </label>

          <div className="operation-actions">
            <button type="button" onClick={() => handleOperacionSubmit("deposito")} disabled={operacionProcesando || !montoOperacion}>
              {operacionProcesando ? "Procesando..." : "Depositar"}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => handleOperacionSubmit("retiro")}
              disabled={operacionProcesando || !montoOperacion}
            >
              {operacionProcesando ? "Procesando..." : "Retirar"}
            </button>
          </div>

          {operacionError && <p className="feedback feedback-error">{operacionError}</p>}
          {operacionExito && <p className="feedback">{operacionExito}</p>}
        </div>

        <div className="history-card">
          <div className="transfer-header">
            <h2>Movimientos</h2>
            <button type="button" className="secondary-btn" onClick={handleHistorialToggle}>
              {mostrarHistorial ? "Ocultar movimientos" : "Ver movimientos"}
            </button>
          </div>

          {mostrarHistorial && (
            <div className="history-content">
              {movimientosCargando ? (
                <p className="transfer-empty">Cargando historial...</p>
              ) : movimientosError ? (
                <p className="feedback feedback-error">{movimientosError}</p>
              ) : movimientos.length === 0 ? (
                <p className="transfer-empty">No hay movimientos registrados todavía.</p>
              ) : (
                <>
                  <div className="history-filters">
                    <label className="filter-field">
                      Tipo
                      <select value={filtroTipo} onChange={(event) => setFiltroTipo(event.target.value)}>
                        <option value="todos">Todos</option>
                        <option value="envio">Envío</option>
                        <option value="recepcion">Recepción</option>
                      </select>
                    </label>

                    <label className="filter-field">
                      Mes
                      <select value={filtroMes} onChange={(event) => setFiltroMes(event.target.value)}>
                        <option value="todos">Todos</option>
                        {opcionesMeses.map((mes) => (
                          <option key={mes.value} value={mes.value}>
                            {mes.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="filter-field">
                      Contraparte
                      <select value={filtroContraparte} onChange={(event) => setFiltroContraparte(event.target.value)}>
                        <option value="todos">Todas</option>
                        {opcionesContraparte.map((contraparte) => (
                          <option key={contraparte} value={contraparte}>
                            {contraparte}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {movimientosFiltrados.length === 0 ? (
                    <p className="transfer-empty">No hay movimientos con esos filtros.</p>
                  ) : (
                    <ul className="history-list">
                      {movimientosFiltrados.map((movimiento) => {
                        const esEnvio = movimiento.emisorUid === usuario.uid;

                        return (
                          <li key={movimiento.id} className="history-item">
                            <div>
                              <p className="history-title">
                                {esEnvio ? "Envío" : "Recepción"} · {obtenerContraparte(movimiento)}
                              </p>
                              <p className="history-meta">
                                {formatearFechaHora(movimiento.fecha)} · {movimiento.descripcion || "Sin descripción"}
                              </p>
                            </div>
                            <p className={`history-amount ${esEnvio ? "negative" : "positive"}`}>
                              {esEnvio ? "-" : "+"}
                              {formatearSaldo(movimiento.monto)}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;