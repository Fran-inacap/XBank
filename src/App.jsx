import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./App.css";

const SALDO_INICIAL = 100000;

function App() {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [perfilCargando, setPerfilCargando] = useState(true);
  const [iniciarSesion, setIniciarSesion] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [perfilError, setPerfilError] = useState("");
  const [procesando, setProcesando] = useState(false);

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

  const formatearSaldo = (valor) => {
    const numero = Number(valor ?? 0);
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(numero);
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
      </div>
    </div>
  );
}

export default App;