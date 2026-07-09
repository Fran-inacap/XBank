import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const SALDO_INICIAL = 100000;

const initialState = {
  user: null,
  profile: null,
  loading: true,
  profileLoading: false,
  profileError: "",
  error: "",
};

function authReducer(state, action) {
  switch (action.type) {
    case "SET_AUTH_USER":
      return { ...state, user: action.payload };
    case "SET_PROFILE":
      return { ...state, profile: action.payload };
    case "SET_PROFILE_LOADING":
      return { ...state, profileLoading: action.payload };
    case "SET_PROFILE_ERROR":
      return { ...state, profileError: action.payload };
    case "SET_AUTH_LOADING":
      return { ...state, loading: action.payload };
    case "SET_AUTH_ERROR":
      return { ...state, error: action.payload };
    case "CLEAR_AUTH_ERROR":
      return { ...state, error: "" };
    case "RESET_SESSION":
      return {
        ...initialState,
        loading: false,
      };
    default:
      return state;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      dispatch({ type: "SET_AUTH_USER", payload: authUser });
      dispatch({ type: "SET_AUTH_LOADING", payload: false });

      if (!authUser) {
        dispatch({ type: "RESET_SESSION" });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!state.user?.uid) {
      dispatch({ type: "SET_PROFILE", payload: null });
      dispatch({ type: "SET_PROFILE_LOADING", payload: false });
      dispatch({ type: "SET_PROFILE_ERROR", payload: "" });
      return;
    }

    dispatch({ type: "SET_PROFILE_LOADING", payload: true });
    dispatch({ type: "SET_PROFILE_ERROR", payload: "" });

    const profileRef = doc(db, "users", state.user.uid);
    const unsubscribeProfile = onSnapshot(
      profileRef,
      (snapshot) => {
        if (snapshot.exists()) {
          dispatch({ type: "SET_PROFILE", payload: { id: snapshot.id, ...snapshot.data() } });
        } else {
          dispatch({ type: "SET_PROFILE", payload: null });
          dispatch({ type: "SET_PROFILE_ERROR", payload: "No se encontró el perfil del usuario." });
        }

        dispatch({ type: "SET_PROFILE_LOADING", payload: false });
      },
      (profileError) => {
        console.error("No se pudo cargar el perfil del usuario:", profileError);
        dispatch({ type: "SET_PROFILE_ERROR", payload: "No se pudo cargar la información del saldo." });
        dispatch({ type: "SET_PROFILE_LOADING", payload: false });
      }
    );

    return () => unsubscribeProfile();
  }, [state.user?.uid]);

  const login = async (email, password) => {
    dispatch({ type: "CLEAR_AUTH_ERROR" });
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    dispatch({ type: "SET_AUTH_USER", payload: credentials.user });
    return credentials;
  };

  const register = async (email, password, nombre) => {
    dispatch({ type: "CLEAR_AUTH_ERROR" });

    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    const profileRef = doc(db, "users", credentials.user.uid);
    const profileSnapshot = await getDoc(profileRef);

    if (!profileSnapshot.exists()) {
      await setDoc(profileRef, {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        saldo: SALDO_INICIAL,
        creadoEn: serverTimestamp(),
      });
    }

    dispatch({ type: "SET_AUTH_USER", payload: credentials.user });
    return credentials;
  };

  const logout = async () => {
    dispatch({ type: "CLEAR_AUTH_ERROR" });
    await signOut(auth);
    dispatch({ type: "RESET_SESSION" });
  };

  const updateProfile = (updater) => {
    dispatch({
      type: "SET_PROFILE",
      payload: typeof updater === "function" ? updater(state.profile) : updater,
    });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_AUTH_ERROR" });
  };

  const value = useMemo(
    () => ({
      user: state.user,
      profile: state.profile,
      loading: state.loading,
      profileLoading: state.profileLoading,
      profileError: state.profileError,
      error: state.error,
      login,
      register,
      logout,
      updateProfile,
      clearError,
    }),
    [state.user, state.profile, state.loading, state.profileLoading, state.profileError, state.error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
