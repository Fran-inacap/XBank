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

describe("Formulario de transferencia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunTransaction.mockResolvedValue(undefined);

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

  it("renderiza los campos del formulario de transferencia", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /transferir/i }));

    expect(screen.getByLabelText(/destinatario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
  });

  it("renderiza el botón de enviar del formulario de transferencia", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /transferir/i }));

    expect(screen.getByRole("button", { name: /confirmar transferencia/i })).toBeInTheDocument();
  });

  it("muestra error con monto inválido y no llama al servicio de transferencia", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /transferir/i }));
    await user.selectOptions(screen.getByLabelText(/destinatario/i), "user-2");
    await user.clear(screen.getByLabelText(/monto/i));
    await user.type(screen.getByLabelText(/monto/i), "10.5");
    fireEvent.submit(screen.getByLabelText(/monto/i).closest("form"));

    expect(await screen.findByText(/ingresa un monto válido mayor a cero/i)).toBeVisible();
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it("llama al servicio de transferencia una vez con argumentos correctos al enviar datos válidos", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /transferir/i }));
    await user.selectOptions(screen.getByLabelText(/destinatario/i), "user-2");
    await user.clear(screen.getByLabelText(/monto/i));
    await user.type(screen.getByLabelText(/monto/i), "500");
    await user.click(screen.getByRole("button", { name: /confirmar transferencia/i }));

    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    expect(mockRunTransaction).toHaveBeenCalledWith({}, expect.any(Function));
  });

  it("deshabilita el botón de transferir mientras la transferencia está en curso", async () => {
    const user = userEvent.setup();
    let resolverTransaccion;

    mockRunTransaction.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolverTransaccion = resolve;
      })
    );

    render(<App />);

    await user.click(screen.getByRole("button", { name: /transferir/i }));
    await user.selectOptions(screen.getByLabelText(/destinatario/i), "user-2");
    await user.clear(screen.getByLabelText(/monto/i));
    await user.type(screen.getByLabelText(/monto/i), "500");
    await user.click(screen.getByRole("button", { name: /confirmar transferencia/i }));

    expect(screen.getByRole("button", { name: /procesando/i })).toBeDisabled();

    resolverTransaccion?.();
  });
});