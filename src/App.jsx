import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./App.css";

const SALDO_INICIAL = 100000;

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [iniciarSesion, setIniciarSesion] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuarioActual) => {
      setUsuario(usuarioActual);
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

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
      <div className="auth-card">
        <h1>XBank</h1>
        <p>Has iniciado sesión correctamente.</p>
        <p>{usuario.email}</p>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
}

export default App;