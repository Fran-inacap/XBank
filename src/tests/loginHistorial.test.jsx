import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

const mockUseAuth = vi.fn();
const mockOnSnapshot = vi.fn();
let loginSpy;

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_, nombreColeccion) => ({ nombreColeccion })),
  doc: vi.fn(() => ({})),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => "timestamp-mock"),
}));

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginSpy = vi.fn();

    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      profileLoading: false,
      profileError: "",
      error: "",
      login: loginSpy,
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      clearError: vi.fn(),
    });

    mockOnSnapshot.mockImplementation((ref, onNext) => {
      if (ref?.nombreColeccion === "users") {
        onNext({ docs: [] });
      }

      if (ref?.nombreColeccion === "movimientos") {
        onNext({
          docs: [
            {
              id: "mov-1",
              data: () => ({
                tipo: "transferencia",
                emisorUid: "user-2",
                receptorUid: "user-1",
                monto: 250,
                descripcion: "Pago recibido",
                fecha: { toDate: () => new Date("2026-07-15T12:00:00Z") },
              }),
            },
            {
              id: "mov-2",
              data: () => ({
                tipo: "transferencia",
                emisorUid: "user-1",
                receptorUid: "user-2",
                monto: 100,
                descripcion: "Pago enviado",
                fecha: { toDate: () => new Date("2026-07-14T12:00:00Z") },
              }),
            },
          ],
        });
      }

      return vi.fn();
    });
  });

  it("no llama al servicio de autenticación cuando los campos están vacíos", () => {
    render(<App />);

    fireEvent.submit(screen.getByRole("button", { name: /iniciar sesión/i }).closest("form"));

    expect(loginSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/completa tu correo y contraseña/i)).toBeInTheDocument();
  });

  it("muestra un mensaje de error cuando el servicio de autenticación rechaza credenciales inválidas", async () => {
    const user = userEvent.setup();

    loginSpy.mockRejectedValueOnce({ code: "auth/invalid-credential" });

    render(<App />);

    await user.type(screen.getByLabelText(/correo electrónico/i), "correo@ejemplo.com");
    await user.type(screen.getByLabelText(/contraseña/i), "123456");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(await screen.findByText(/usuario y\/o contraseña incorrectos/i)).toBeInTheDocument();
    expect(loginSpy).toHaveBeenCalledWith("correo@ejemplo.com", "123456");
  });

  it("renderiza el historial ordenado del movimiento más reciente al más antiguo", async () => {
    const user = userEvent.setup();

    mockUseAuth.mockReturnValue({
      user: { uid: "user-1", email: "origen@correo.com" },
      profile: { saldo: 1000 },
      loading: false,
      profileLoading: false,
      profileError: "",
      error: "",
      login: loginSpy,
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      clearError: vi.fn(),
    });

    render(<App />);

    await user.click(screen.getByRole("button", { name: /ver movimientos/i }));

    const historyItems = await screen.findAllByRole("listitem");

    expect(historyItems[0]).toHaveTextContent(/pago recibido/i);
    expect(historyItems[0]).toHaveTextContent(/recepción/i);
    expect(historyItems[1]).toHaveTextContent(/pago enviado/i);
    expect(historyItems[1]).toHaveTextContent(/envío/i);
  });
});