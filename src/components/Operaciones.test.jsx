import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

const mockUseAuth = vi.fn();
const mockOnSnapshot = vi.fn();
const mockRunTransaction = vi.fn();

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
  runTransaction: (...args) => mockRunTransaction(...args),
  serverTimestamp: vi.fn(() => "timestamp-mock"),
}));

describe("Operaciones bancarias", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunTransaction.mockResolvedValue(undefined);
    vi.stubGlobal("confirm", vi.fn(() => true));

    mockUseAuth.mockReturnValue({
      user: { uid: "user-1", email: "origen@correo.com" },
      profile: { saldo: 1000 },
      loading: false,
      profileLoading: false,
      profileError: "",
      error: "",
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      clearError: vi.fn(),
    });

    mockOnSnapshot.mockImplementation((ref, onNext) => {
      if (ref?.nombreColeccion === "users") {
        onNext({
          docs: [
            {
              id: "user-2",
              data: () => ({
                nombre: "Destinatario",
                email: "destino@correo.com",
                saldo: 500,
              }),
            },
          ],
        });
      }

      if (ref?.nombreColeccion === "movimientos") {
        onNext({ docs: [] });
      }

      return vi.fn();
    });
  });

  it("muestra error en depósito con monto inválido y no llama al servicio", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /depositar/i }));
    fireEvent.change(screen.getByLabelText(/monto/i), { target: { value: "-10" } });
    fireEvent.click(screen.getByRole("button", { name: /confirmar depósito/i }));

    expect(await screen.findByText(/ingresa un monto válido mayor a cero/i)).toBeInTheDocument();
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it("realiza un depósito válido y llama al servicio una vez", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /depositar/i }));
    fireEvent.change(screen.getByLabelText(/monto/i), { target: { value: "500" } });
    await user.click(screen.getByRole("button", { name: /confirmar depósito/i }));

    expect(globalThis.confirm).toHaveBeenCalledTimes(1);
    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
  });

  it("muestra error en retiro cuando el monto supera el saldo disponible", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /retirar/i }));
    fireEvent.change(screen.getByLabelText(/monto/i), { target: { value: "1500" } });
    fireEvent.click(screen.getByRole("button", { name: /confirmar retiro/i }));

    expect(await screen.findByText(/no tienes saldo suficiente para realizar este retiro/i)).toBeInTheDocument();
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it("realiza un retiro válido y llama al servicio una vez", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /retirar/i }));
    fireEvent.change(screen.getByLabelText(/monto/i), { target: { value: "500" } });
    await user.click(screen.getByRole("button", { name: /confirmar retiro/i }));

    expect(globalThis.confirm).toHaveBeenCalledTimes(1);
    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
  });
});