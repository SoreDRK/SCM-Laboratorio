import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import { auth } from "./Services/firebase";
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./Services/firebase";
import "./App.css";

function App() {
  const [muestras, setMuestras] = useState([]);
  const [codigo, setCodigo] = useState("");
  const [cliente, setCliente] = useState("");
  const [estado, setEstado] = useState("en_proceso");
  const [observacion, setObservacion] = useState("");
  const [busqueda, setBusqueda] = useState("");
const [mostrarFinalizadas, setMostrarFinalizadas] = useState(false);
const [editandoId, setEditandoId] = useState(null);
const [editCodigo, setEditCodigo] = useState("");
const [editCliente, setEditCliente] = useState("");
const [editEstado, setEditEstado] = useState("en_proceso");
const [editObservacion, setEditObservacion] = useState("");
const [usuario, setUsuario] = useState(null);
const cerrarSesion = async () => {
  await signOut(auth);
};

const eliminarMuestra = async (id) => {
  const confirmar = window.confirm("¿Seguro que deseas eliminar esta muestra?");

  if (!confirmar) return;

  await deleteDoc(doc(db, "muestras", id));
};
const [emailLogin, setEmailLogin] = useState("");
const [passwordLogin, setPasswordLogin] = useState("");
const obtenerFechaHoy = () => {
  const hoy = new Date();
  return hoy.toISOString().split("T")[0];
};

const [fechaSeleccionada, setFechaSeleccionada] = useState(obtenerFechaHoy());
const [verTodasFechas, setVerTodasFechas] = useState(false);
const [cargandoAuth, setCargandoAuth] = useState(true);
 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUsuario(user);
    setCargandoAuth(false);
  });

  return () => unsubscribe();
}, []);
useEffect(() => {
    const q = query(collection(db, "muestras"), orderBy("fechaLlegada", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMuestras(datos);
    });
const muestrasFiltradas = muestras.filter((muestra) => {
  const textoBusqueda = busqueda.toLowerCase();

  const coincideBusqueda =
    muestra.codigo?.toLowerCase().includes(textoBusqueda) ||
    muestra.cliente?.toLowerCase().includes(textoBusqueda);

  const coincideEstado =
    mostrarFinalizadas || muestra.estado !== "finalizada";

  return coincideBusqueda && coincideEstado;
});
    return () => unsubscribe();
  }, []);

  const registrarMuestra = async (e) => {
    e.preventDefault();

    if (!codigo.trim() || !cliente.trim()) {
      alert("Código y cliente son obligatorios");
      return;
    }

    await addDoc(collection(db, "muestras"), {
      codigo: codigo.trim().toUpperCase(),
      cliente: cliente.trim(),
      estado,
      observacion: observacion.trim(),
      fechaLlegada: serverTimestamp(),
      fechaFinalizacion: estado === "finalizada" ? serverTimestamp() : null,
    });

    setCodigo("");
    setCliente("");
    setEstado("en_proceso");
    setObservacion("");
  };

 const cambiarEstado = async (id, nuevoEstado) => {
  const muestraRef = doc(db, "muestras", id);

  await updateDoc(muestraRef, {
    estado: nuevoEstado,
    fechaFinalizacion: nuevoEstado === "finalizada" ? serverTimestamp() : null,
  });
};

const iniciarEdicion = (muestra) => {
  setEditandoId(muestra.id);
  setEditCodigo(muestra.codigo || "");
  setEditCliente(muestra.cliente || "");
  setEditEstado(muestra.estado || "en_proceso");
  setEditObservacion(muestra.observacion || "");
};

const cancelarEdicion = () => {
  setEditandoId(null);
  setEditCodigo("");
  setEditCliente("");
  setEditEstado("en_proceso");
  setEditObservacion("");
};

const guardarEdicion = async (id) => {
  if (!editCodigo.trim() || !editCliente.trim()) {
    alert("Código y cliente son obligatorios");
    return;
  }

  const muestraRef = doc(db, "muestras", id);

  await updateDoc(muestraRef, {
    codigo: editCodigo.trim().toUpperCase(),
    cliente: editCliente.trim(),
    estado: editEstado,
    observacion: editObservacion.trim(),
    fechaFinalizacion: editEstado === "finalizada" ? serverTimestamp() : null,
  });

  cancelarEdicion();
};
const iniciarSesion = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailLogin, passwordLogin);
  } catch (error) {
    alert("Correo o contraseña incorrectos");
  }
};

const formatearFecha = (fecha) => {
  if (!fecha) return "Registrando...";
  return fecha.toDate().toLocaleString("es-PE");
};

const obtenerFechaInput = (fecha) => {
  if (!fecha) return "";

  const fechaJS = fecha.toDate();
  return fechaJS.toISOString().split("T")[0];
};

const calcularTiempo = (fechaLlegada, fechaFinalizacion, estado) => {
  
  if (!fechaLlegada) return "-";

  const llegada = fechaLlegada.toDate();

  const fin =
    estado === "finalizada" && fechaFinalizacion
      ? fechaFinalizacion.toDate()
      : new Date();

  const diferenciaMs = fin - llegada;
  const minutos = Math.floor(diferenciaMs / 60000);

  if (minutos < 60) {
    return `${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  return `${horas} h ${minutosRestantes} min`;
};
const obtenerColorTiempo = (fechaLlegada, fechaFinalizacion, estado) => {
  if (!fechaLlegada) return "";

  const llegada = fechaLlegada.toDate();

  const fin =
    estado === "finalizada" && fechaFinalizacion
      ? fechaFinalizacion.toDate()
      : new Date();

  const minutos = Math.floor((fin - llegada) / 60000);

  if (minutos < 30) return "tiempo-verde";
  if (minutos < 60) return "tiempo-amarillo";

  return "tiempo-rojo";
};
  const etiquetaEstado = (estado) => {
    if (estado === "en_proceso") return "En proceso";
    if (estado === "incidencia") return "Incidencia";
    if (estado === "finalizada") return "Finalizada";
    return estado;
  };
const muestrasPorFecha = muestras.filter((muestra) => {
  if (verTodasFechas) return true;
  return obtenerFechaInput(muestra.fechaLlegada) === fechaSeleccionada;
});
const totalProceso = muestrasPorFecha.filter((m) => m.estado === "en_proceso").length;
const totalIncidencia = muestrasPorFecha.filter((m) => m.estado === "incidencia").length;
const totalFinalizadas = muestrasPorFecha.filter((m) => m.estado === "finalizada").length;
const muestrasFiltradas = muestrasPorFecha.filter((muestra) => {
  const textoBusqueda = busqueda.toLowerCase();

  const coincideBusqueda =
    muestra.codigo?.toLowerCase().includes(textoBusqueda) ||
    muestra.cliente?.toLowerCase().includes(textoBusqueda);

  const coincideEstado =
    mostrarFinalizadas || muestra.estado !== "finalizada";

  return coincideBusqueda && coincideEstado;
});
if (cargandoAuth) {
  return <h2>Cargando...</h2>;
}

if (!usuario) {
  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-overlay">
          <div className="logo-lab">🧪</div>
          <h1>SCM</h1>
          <h2>Laboratorio</h2>
          <p>Sistema de Control de Muestras</p>

          <div className="login-features">
            <div>
              <strong>🔒 Seguro</strong>
              <span>Acceso restringido y protegido</span>
            </div>
            <div>
              <strong>📋 Eficiente</strong>
              <span>Gestiona tus muestras fácilmente</span>
            </div>
            <div>
              <strong>📊 Confiable</strong>
              <span>Datos en tiempo real y respaldados</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-icon">🔐</div>
          <h2>Iniciar sesión</h2>
          <p>Ingresa tus credenciales para acceder al sistema</p>

          <label>Correo electrónico</label>
          <input
            type="email"
            placeholder="ejemplo@laboratorio.com"
            value={emailLogin}
            onChange={(e) => setEmailLogin(e.target.value)}
          />

          <label>Contraseña</label>
          <input
            type="password"
            placeholder="Ingresa tu contraseña"
            value={passwordLogin}
            onChange={(e) => setPasswordLogin(e.target.value)}
          />

          <button className="login-btn" onClick={iniciarSesion}>
            Ingresar
          </button>

          <small>Acceso exclusivo para personal autorizado</small>
        </div>
      </div>
    </div>
  );
}
  return (
    <div className="app">
     <header className="header">
  <div className="header-top">
    <div>
      <h1>🧪 SCM Laboratorio</h1>
      <p>Control de muestras en tiempo real</p>
    </div>

    <button className="logout-btn" onClick={cerrarSesion}>
      Cerrar sesión
    </button>
  </div>
</header>

      <section className="stats">
        <div className="stat-card">
          <span>En proceso</span>
          <strong>{totalProceso}</strong>
        </div>

        <div className="stat-card danger">
          <span>Incidencias</span>
          <strong>{totalIncidencia}</strong>
        </div>

        <div className="stat-card success">
          <span>Finalizadas</span>
          <strong>{totalFinalizadas}</strong>
        </div>

        <div className="stat-card">
          <span>Total</span>
          <strong>{muestras.length}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Registrar muestra</h2>

        <form onSubmit={registrarMuestra} className="form">
          <input
            placeholder="Código"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />

          <input
            placeholder="Cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />

          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="en_proceso">En proceso</option>
            <option value="incidencia">Incidencia</option>
            <option value="finalizada">Finalizada</option>
          </select>

          <input
            placeholder="Observación / incidencia"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
          />

          <button type="submit">Registrar</button>
        </form>
      </section>

      <section className="panel">
        <h2>Muestras registradas</h2>
<div className="filters">
 <input
  placeholder="Buscar por código o cliente..."
  value={busqueda}
  onChange={(e) => setBusqueda(e.target.value)}
/>

<input
  type="date"
  value={fechaSeleccionada}
  onChange={(e) => {
    setFechaSeleccionada(e.target.value);
    setVerTodasFechas(false);
  }}
/>

<button
  type="button"
  onClick={() => {
    setFechaSeleccionada(obtenerFechaHoy());
    setVerTodasFechas(false);
  }}
>
  Hoy
</button>

<button
  type="button"
  onClick={() => setVerTodasFechas(true)}
>
  Ver todas
</button>

  <label>
    <input
      type="checkbox"
      checked={mostrarFinalizadas}
      onChange={(e) => setMostrarFinalizadas(e.target.checked)}
    />
    Mostrar finalizadas
  </label>
</div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Llegada</th>
                <th>Observación</th>
                <th>Tiempo</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
            {muestrasFiltradas.map((muestra) => (
                <tr key={muestra.id}>
                  <td>
  {editandoId === muestra.id ? (
    <input value={editCodigo} onChange={(e) => setEditCodigo(e.target.value)} />
  ) : (
    muestra.codigo
  )}
</td>

<td>
  {editandoId === muestra.id ? (
    <input value={editCliente} onChange={(e) => setEditCliente(e.target.value)} />
  ) : (
    muestra.cliente
  )}
</td>
                <td>
  {editandoId === muestra.id ? (
    <select
      value={editEstado}
      onChange={(e) => setEditEstado(e.target.value)}
    >
      <option value="en_proceso">En proceso</option>
      <option value="incidencia">Incidencia</option>
      <option value="finalizada">Finalizada</option>
    </select>
  ) : (
    <span className={`badge ${muestra.estado}`}>
      {etiquetaEstado(muestra.estado)}
    </span>
  )}
</td>
                  <td>{formatearFecha(muestra.fechaLlegada)}</td>
                  <td>
  {editandoId === muestra.id ? (
    <input
      value={editObservacion}
      onChange={(e) => setEditObservacion(e.target.value)}
    />
  ) : (
    muestra.observacion || "Sin observación"
  )}
</td>
  <td
  className={obtenerColorTiempo(
    muestra.fechaLlegada,
    muestra.fechaFinalizacion,
    muestra.estado
  )}
>
  {calcularTiempo(
    muestra.fechaLlegada,
    muestra.fechaFinalizacion,
    muestra.estado
  )}
</td>
                  <td className="actions">
                    <button className="edit-btn" onClick={() => iniciarEdicion(muestra)}>
  Editar
</button>
                    {editandoId === muestra.id && (
  <>
    <button
      className="save-btn"
      onClick={() => guardarEdicion(muestra.id)}
    >
      Guardar
    </button>

    <button
      className="cancel-btn"
      onClick={cancelarEdicion}
    >
      Cancelar
    </button>
  </>
)}
                    <button onClick={() => cambiarEstado(muestra.id, "en_proceso")}>
                      Proceso
                    </button>
                    <button onClick={() => cambiarEstado(muestra.id, "incidencia")}>
                      Incidencia
                    </button>
                    <button onClick={() => cambiarEstado(muestra.id, "finalizada")}>
                      Finalizar
                      <button className="delete-btn" onClick={() => eliminarMuestra(muestra.id)}>
  Eliminar
</button>
                    </button>
                  </td>
                </tr>
              ))}

            {muestrasFiltradas.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty">
                    No hay muestras registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    );
    }
export default App;