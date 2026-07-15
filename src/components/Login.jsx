export default function Login({
  modoOscuro,
  iniciarSesion,
  nombre,
  email,
  password,
  procesando,
  error,
  sessionError,
  onSubmit,
  onToggleModo,
  onNombreChange,
  onEmailChange,
  onPasswordChange,
}) {
  return (
    <div className={`app ${modoOscuro ? "app-dark" : ""}`}>
      <form className={`auth-card ${modoOscuro ? "card-dark" : ""}`} onSubmit={onSubmit}>
        <div className="auth-header">
          <h1>XBank</h1>
          <p>Gestiona tu dinero con seguridad</p>
        </div>

        {!iniciarSesion && (
          <label>
            Nombre completo
            <input value={nombre} onChange={(event) => onNombreChange(event.target.value)} placeholder="Juan Pérez" required />
          </label>
        )}

        <label>
          Correo electrónico
          <input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="correo@ejemplo.com" required />
        </label>

        <label>
          Contraseña
          <input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="Mínimo 6 caracteres" required />
        </label>

        <button type="submit" disabled={procesando}>
          {procesando ? "Procesando..." : iniciarSesion ? "Iniciar sesión" : "Crear cuenta"}
        </button>

        <button type="button" className="secondary-btn" onClick={onToggleModo}>
          {iniciarSesion ? "Crear una cuenta" : "Ya tengo cuenta"}
        </button>

        {(error || sessionError) && <p className="feedback feedback-error">{error || sessionError}</p>}
      </form>
    </div>
  );
}