import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
});