import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

const mockUseAuth = vi.fn();
let loginSpy;

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(),
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
});