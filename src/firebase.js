// 1. Importamos las funciones que necesitamos del SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 2. La configuración de TU proyecto (cópiala de la consola)
const firebaseConfig = {
  apiKey: "AIzaSyAaOdSCIu83D5ub8byKWIaF2qXyNihjJFI",
  authDomain: "xbank-dd5bf.firebaseapp.com",
  projectId: "xbank-dd5bf",
  storageBucket: "xbank-dd5bf.firebasestorage.app",
  messagingSenderId: "790574233331",
  appId: "1:790574233331:web:dbd98cd03cf6a7bb436986"
};

// 3. Inicializamos Firebase y obtenemos la base de datos
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);