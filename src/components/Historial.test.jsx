import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

const mockUseAuth = vi.fn();
const mockOnSnapshot = vi.fn();
const mockUnsubscribeUsuarios = vi.fn();
const mockUnsubscribeMovimientos = vi.fn();
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

describe("Historial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginSpy = vi.fn();

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

    mockOnSnapshot.mockImplementation((ref, onNext) => {
      if (ref?.nombreColeccion === "users") {
        onNext({ docs: [] });
        return mockUnsubscribeUsuarios;
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
        return mockUnsubscribeMovimientos;
      }

      return vi.fn();
    });
  });

  it("renderiza el historial ordenado del movimiento más reciente al más antiguo", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /ver movimientos/i }));

    const historyItems = await screen.findAllByRole("listitem");

    expect(historyItems[0]).toHaveTextContent(/pago recibido/i);
    expect(historyItems[0]).toHaveTextContent(/recepción/i);
    expect(historyItems[1]).toHaveTextContent(/pago enviado/i);
    expect(historyItems[1]).toHaveTextContent(/envío/i);
  });

  it("distingue envíos de recepciones en el historial", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /ver movimientos/i }));

    const historyItems = await screen.findAllByRole("listitem");

    expect(historyItems[0]).toHaveTextContent(/recepción\s*·\s*usuario externo/i);
    expect(historyItems[0]).toHaveTextContent(/\+\$250/);
    expect(historyItems[1]).toHaveTextContent(/envío\s*·\s*usuario externo/i);
    expect(historyItems[1]).toHaveTextContent(/-\$100/);
  });

  it("muestra un estado vacío cuando no hay movimientos", async () => {
    const user = userEvent.setup();

    mockOnSnapshot.mockImplementation((ref, onNext) => {
      if (ref?.nombreColeccion === "users") {
        onNext({ docs: [] });
        return mockUnsubscribeUsuarios;
      }

      if (ref?.nombreColeccion === "movimientos") {
        onNext({ docs: [] });
        return mockUnsubscribeMovimientos;
      }

      return vi.fn();
    });

    render(<App />);

    await user.click(screen.getByRole("button", { name: /ver movimientos/i }));

    expect(await screen.findByText(/no hay movimientos registrados todavía/i)).toBeInTheDocument();
  });

  it("llama a unsubscribe al desmontar el componente", () => {
    const { unmount } = render(<App />);

    unmount();

    expect(mockUnsubscribeUsuarios).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribeMovimientos).toHaveBeenCalledTimes(1);
  });
});