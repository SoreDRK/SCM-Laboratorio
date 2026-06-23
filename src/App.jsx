import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import { auth } from "./Services/firebase";
import * as XLSX from "xlsx";
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
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [estado, setEstado] = useState("en_proceso");
  const [observacion, setObservacion] = useState("");
  const [busqueda, setBusqueda] = useState("");
const [editandoId, setEditandoId] = useState(null);
const [editCodigo, setEditCodigo] = useState("");
const [editCliente, setEditCliente] = useState("");
const [vistaActiva, setVistaActiva] = useState("inicio");
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
const exportarExcel = () => {
  const datosExcel = muestrasFiltradas.map((muestra) => ({
    Código: muestra.codigo || "",
    Cliente: muestra.cliente || "",
    Estado: etiquetaEstado(muestra.estado),
    Llegada: formatearFecha(muestra.fechaLlegada),
    Observación: muestra.observacion || "Sin observación",
    Tiempo: calcularTiempo(
      muestra.fechaLlegada,
      muestra.fechaFinalizacion,
      muestra.estado
    ),
  }));

  const hoja = XLSX.utils.json_to_sheet(datosExcel);
  const libro = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(libro, hoja, "Muestras");

  XLSX.writeFile(libro, `SCM_Muestras_${fechaSeleccionada}.xlsx`);
};
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
const mostrarDashboard = vistaActiva === "inicio";
const mostrarFormulario = vistaActiva === "inicio" || vistaActiva === "registrar";
const mostrarTabla = vistaActiva !== "registrar";

const tituloVista = () => {
  if (vistaActiva === "registrar") return "Registrar muestra";
  if (vistaActiva === "muestras") return "Todas las muestras";
  if (vistaActiva === "incidencias") return "Incidencias";
  if (vistaActiva === "finalizadas") return "Muestras finalizadas";
  return "¡Bienvenido! 👋";
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

  const coincideVista =
    vistaActiva === "inicio" ||
    vistaActiva === "muestras" ||
    vistaActiva === "registrar" ||
    (vistaActiva === "incidencias" && muestra.estado === "incidencia") ||
    (vistaActiva === "finalizadas" && muestra.estado === "finalizada");

return coincideBusqueda && coincideVista;
});
const exportarExcel = () => {
  const datosExcel = muestrasFiltradas.map((muestra) => ({
    Código: muestra.codigo || "",
    Cliente: muestra.cliente || "",
    Estado: etiquetaEstado(muestra.estado),
    Llegada: formatearFecha(muestra.fechaLlegada),
    Observación: muestra.observacion || "Sin observación",
    Tiempo: calcularTiempo(
      muestra.fechaLlegada,
      muestra.fechaFinalizacion,
      muestra.estado
    ),
  }));

  const hoja = XLSX.utils.json_to_sheet(datosExcel);
  const libro = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(libro, hoja, "Muestras");

  XLSX.writeFile(libro, `SCM_Muestras_${fechaSeleccionada}.xlsx`);
};
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
  <div className="dashboard-layout">
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">🧪</div>
        <div>
          <h1>SCM</h1>
          <span>Laboratorio</span>
        </div>
      </div>

      <nav className="sidebar-nav">
  <button
    className={vistaActiva === "inicio" ? "active" : ""}
    onClick={() => setVistaActiva("inicio")}
  >
    🏠 Inicio
  </button>

  <button
    className={vistaActiva === "registrar" ? "active" : ""}
    onClick={() => setVistaActiva("registrar")}
  >
    ➕ Registrar muestra
  </button>

  <button
    className={vistaActiva === "muestras" ? "active" : ""}
    onClick={() => setVistaActiva("muestras")}
  >
    📋 Muestras
  </button>

  <button
    className={vistaActiva === "incidencias" ? "active" : ""}
    onClick={() => setVistaActiva("incidencias")}
  >
    ⚠️ Incidencias
  </button>

  <button
    className={vistaActiva === "finalizadas" ? "active" : ""}
    onClick={() => setVistaActiva("finalizadas")}
  >
    ✅ Finalizadas
  </button>
</nav>

      <div className="sidebar-user">
        <div className="avatar">SC</div>
        <div>
          <strong>SCM Lab</strong>
          <span>Administrador</span>
        </div>
      </div>

      <button className="sidebar-logout" onClick={cerrarSesion}>
        ↪ Cerrar sesión
      </button>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div>
          <h2>{tituloVista()}</h2>
          <p>Control de muestras en tiempo real</p>
        </div>

        <div className="topbar-actions">
  <div className="date-pill">📅 {fechaSeleccionada}</div>

  <div
    className="notification"
    onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
  >
    🔔

    {totalIncidencia > 0 && (
      <span className="notification-badge">
        {totalIncidencia}
      </span>
    )}
  </div>
</div>

{mostrarNotificaciones && (
  <div className="notification-panel">
    {totalIncidencia > 0 && (
      <div className="notification-item warning">
        ⚠️ Hay {totalIncidencia} muestras con incidencia
      </div>
    )}

    {totalProceso > 0 && (
      <div className="notification-item">
        ⏳ Hay {totalProceso} muestras en proceso
      </div>
    )}

    {totalFinalizadas > 0 && (
      <div className="notification-item success">
        ✅ {totalFinalizadas} muestras finalizadas
      </div>
    )}

    {totalIncidencia === 0 && totalProceso === 0 && totalFinalizadas === 0 && (
      <div className="notification-item">
        Sin notificaciones
      </div>
    )}
  </div>
)}
</header>
{mostrarDashboard && (
  <section className="stats-grid">
        <div className="metric-card blue">
          <div className="metric-icon">🧪</div>
          <div>
            <span>En proceso</span>
            <strong>{totalProceso}</strong>
            <p>En análisis</p>
          </div>
        </div>

        <div className="metric-card red">
          <div className="metric-icon">⚠️</div>
          <div>
            <span>Incidencias</span>
            <strong>{totalIncidencia}</strong>
            <p>Requieren atención</p>
          </div>
        </div>

        <div className="metric-card green">
          <div className="metric-icon">✅</div>
          <div>
            <span>Finalizadas</span>
            <strong>{totalFinalizadas}</strong>
            <p>Completadas</p>
          </div>
        </div>

        <div className="metric-card purple">
          <div className="metric-icon">📦</div>
          <div>
            <span>Total</span>
            <strong>{muestras.length}</strong>
            <p>Muestras registradas</p>
          </div>
        </div>
      </section>
      )}
{mostrarFormulario && (
  <section className="content-card">
    <div className="section-title">
      <span>📝</span>
      <h3>Registrar muestra</h3>
    </div>
<div className="section-title">
  <div>
    <span>📄</span>
    <h3>Muestras registradas</h3>
  </div>

</div>
    <form onSubmit={registrarMuestra} className="sample-form">
      <label>
        Código
        <input
          placeholder="Ej. MUE-001"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />
      </label>

      <label>
        Cliente
        <input
          placeholder="Nombre del cliente"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />
      </label>

      <label>
        Estado
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="en_proceso">En proceso</option>
          <option value="incidencia">Incidencia</option>
          <option value="finalizada">Finalizada</option>
        </select>
      </label>

      <label>
        Observación / incidencia
        <input
          placeholder="Escribe una observación"
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
        />
      </label>

      <button type="submit" className="primary-btn">
        Registrar muestra
      </button>
    </form>
  </section>
)}

{mostrarTabla && (
  <section className="content-card">
    <div className="section-title">
      <span>📄</span>
      <h3>
        {vistaActiva === "incidencias"
          ? "Muestras con incidencia"
          : vistaActiva === "finalizadas"
          ? "Muestras finalizadas"
          : "Muestras registradas"}
      </h3>
    </div>
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

      <button type="button" onClick={() => setVerTodasFechas(true)}>
        Ver todas
      </button>
      <button
  type="button"
  className="excel-btn"
  onClick={exportarExcel}
>
  📥 Exportar Excel
</button>
    </div>

    <div className="table-wrapper">
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
                  <input
                    value={editCodigo}
                    onChange={(e) => setEditCodigo(e.target.value)}
                  />
                ) : (
                  muestra.codigo
                )}
              </td>

              <td>
                {editandoId === muestra.id ? (
                  <input
                    value={editCliente}
                    onChange={(e) => setEditCliente(e.target.value)}
                  />
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
              <button
  className="table-action edit"
  onClick={() => iniciarEdicion(muestra)}
>
  ✏️
</button>

{editandoId === muestra.id && (
  <>
    <button
      className="table-action save"
      onClick={() => guardarEdicion(muestra.id)}
    >
      💾
    </button>

    <button
      className="table-action cancel"
      onClick={cancelarEdicion}
    >
      ✖️
    </button>
  </>
)}

<button
  className="table-action warning"
  onClick={() => cambiarEstado(muestra.id, "incidencia")}
>
  ⚠️
</button>

<button
  className="table-action success"
  onClick={() => cambiarEstado(muestra.id, "finalizada")}
>
  ✅
</button>

<button
  className="table-action delete"
  onClick={() => eliminarMuestra(muestra.id)}
>
  🗑️
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
)}
</main>
</div>
);
}

export default App;