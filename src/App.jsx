import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, addDoc, onSnapshot,
  doc, updateDoc, deleteDoc,
  query, orderBy
} from "firebase/firestore";
import "./App.css";

function App() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [nombre, setNombre] = useState("");
  const [curso, setCurso] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  // READ — tiempo real
  useEffect(() => {
    const q = query(
      collection(db, "estudiantes"),
      orderBy("creadoEn", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setEstudiantes(datos);
    });
    return () => unsubscribe();
  }, []);

  // CREATE o UPDATE
  const guardar = async () => {
    if (nombre.trim() === "") return;
    if (editandoId === null) {
      await addDoc(collection(db, "estudiantes"), {
        nombre, curso, creadoEn: new Date()
      });
    } else {
      await updateDoc(doc(db, "estudiantes", editandoId), {
        nombre, curso
      });
      setEditandoId(null);
    }
    setNombre("");
    setCurso("");
  };

  const editar = (est) => {
    setEditandoId(est.id);
    setNombre(est.nombre);
    setCurso(est.curso);
  };

  // DELETE
  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este estudiante?")) return;
    await deleteDoc(doc(db, "estudiantes", id));
  };

    return (
    <div className="app">
      <h1>📚 Registro de Estudiantes</h1>

      <div className="formulario">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del estudiante"
        />
        <input
          value={curso}
          onChange={(e) => setCurso(e.target.value)}
          placeholder="Curso"
        />
        <button onClick={guardar}>
          {editandoId ? "Actualizar" : "Agregar"}
        </button>
      </div>

      <ul className="lista">
        {estudiantes.map((est) => (
          <li key={est.id}>
            <span>
              <strong>{est.nombre}</strong> — {est.curso}
            </span>
            <div>
              <button onClick={() => editar(est)}>✏️</button>
              <button onClick={() => eliminar(est.id)}>🗑️</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;