import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./App.css";

const SALDO_INICIAL = 100000;

function App() {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [perfilCargando, setPerfilCargando] = useState(true);
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
  const [error, setError] = useState("");
  const [perfilError, setPerfilError] = useState("");
  const [transferenciaError, setTransferenciaError] = useState("");
  const [transferenciaExito, setTransferenciaExito] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [transferenciaProcesando, setTransferenciaProcesando] = useState(false);

  useEffect(() => {
    // Se suscribe al estado de autenticación para saber si hay un usuario activo.
    const unsubscribeAuth = onAuthStateChanged(auth, (usuarioActual) => {
      setUsuario(usuarioActual);
      setCargando(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Se escucha el documento del usuario en Firestore para mostrar saldo y nombre en tiempo real.
    if (!usuario?.uid) {
      setPerfil(null);
      setPerfilCargando(false);
      setPerfilError("");
      return;
    }

    setPerfilCargando(true);
    setPerfilError("");

    const perfilRef = doc(db, "users", usuario.uid);
    const unsubscribePerfil = onSnapshot(
      perfilRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPerfil({ id: snapshot.id, ...snapshot.data() });
        } else {
          setPerfil(null);
          setPerfilError("No se encontró el perfil del usuario.");
        }
        setPerfilCargando(false);
      },
      (snapshotError) => {
        console.error("No se pudo cargar el perfil del usuario:", snapshotError);
        setPerfilError("No se pudo cargar la información del saldo.");
        setPerfilCargando(false);
      }
    );

    return () => unsubscribePerfil();
  }, [usuario?.uid]);

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
        credencial = await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        credencial = await createUserWithEmailAndPassword(auth, email.trim(), password);

        const perfilRef = doc(db, "users", credencial.user.uid);
        const perfilSnapshot = await getDoc(perfilRef);

        if (!perfilSnapshot.exists()) {
          await setDoc(perfilRef, {
            nombre: nombre.trim(),
            email: email.trim().toLowerCase(),
            saldo: SALDO_INICIAL,
            creadoEn: serverTimestamp(),
          });
        }
      }

      setEmail("");
      setPassword("");
      setNombre("");
      setError("");
      console.info("Autenticación completada", credencial.user.email);
    } catch (authError) {
      setError(authError.message || "No se pudo completar la operación.");
    } finally {
      setProcesando(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const resetForms = () => {
    setEmail("");
    setPassword("");
    setNombre("");
    setError("");
    setIniciarSesion((valor) => !valor);
  };

  const handleAmountChange = (event) => {
    setMontoTransferencia(event.target.value);

    if (transferenciaError) {
      setTransferenciaError("");
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

      setPerfil((perfilActual) => {
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

  if (cargando) {
    return <div className="app loading">Cargando...</div>;
  }

  if (!usuario) {
    return (
      <div className="app">
        <form className="auth-card" onSubmit={handleAuthSubmit}>
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

          {error && <p className="feedback feedback-error">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Bienvenido a XBank</p>
            <h1>{perfil?.nombre || usuario.email}</h1>
          </div>
          <button type="button" className="secondary-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>

        <div className="saldo-card">
          <p className="saldo-label">Saldo actual</p>

          {perfilCargando ? (
            <p className="saldo-value">Cargando saldo...</p>
          ) : perfilError ? (
            <p className="feedback feedback-error">{perfilError}</p>
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
                <ul className="history-list">
                  {movimientos.map((movimiento) => {
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;