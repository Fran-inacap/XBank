import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPanel() {
  const { login, register, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        await login(email, password);
        setMessage("Sesión iniciada correctamente");
      } else {
        await register(email, password, nombre);
        setMessage("Cuenta creada correctamente");
      }
    } catch (submitError) {
      setMessage(submitError.message || "No se pudo completar la operación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <div className="auth-header">
        <h1>XBank</h1>
        <p>Gestiona tu dinero con seguridad</p>
      </div>

      {!isLogin && (
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

      <button type="submit" disabled={loading}>
        {loading ? "Procesando..." : isLogin ? "Iniciar sesión" : "Crear cuenta"}
      </button>

      <button type="button" className="secondary-btn" onClick={() => setIsLogin((value) => !value)}>
        {isLogin ? "Crear una cuenta" : "Ya tengo cuenta"}
      </button>

      {(message || error) && <p className={`feedback ${error ? "feedback-error" : ""}`}>{message || error}</p>}
    </form>
  );
}
