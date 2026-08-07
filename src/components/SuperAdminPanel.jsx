import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

const TIPOS_NEGOCIO = ["Gimnasio", "Cafetería", "Tienda de ropa", "Puesto de ventas", "Otro"];
const ESTADOS = ["prueba", "activa", "vencida", "suspendida"];

const ESTADO_CONFIG = {
  prueba:     { label: "Prueba gratuita", color: "text-flex-glow border-flex/40 bg-flex/10" },
  activa:     { label: "Activa",          color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  vencida:    { label: "Vencida",         color: "text-amberwarn-glow border-amber-500/30 bg-amber-500/10" },
  suspendida: { label: "Suspendida",      color: "text-blood-glow border-blood/30 bg-blood/10" },
};

function diasRestantes(fechaVencimiento) {
  if (!fechaVencimiento) return null;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const venc = new Date(fechaVencimiento + "T00:00:00");
  return Math.round((venc - hoy) / (1000*60*60*24));
}

function hoyISO() { return new Date().toISOString().split("T")[0]; }

function sumarDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().split("T")[0];
}

const VACIO = {
  nombre: "", tipo: "Gimnasio", url: "", adminEmail: "",
  estado: "prueba", fechaInicio: hoyISO(), fechaVencimiento: sumarDias(30), notas: "",
};

export default function SuperAdminPanel() {
  const { perfil, cerrarSesion } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "licencias"), (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
      setClientes(lista);
      setCargando(false);
    });
    return unsub;
  }, []);

  const clientesFiltrados = clientes.filter((c) => {
    const coincide = c.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    if (!coincide) return false;
    if (filtroEstado === "todos") return true;
    return c.estado === filtroEstado;
  });

  const conteos = clientes.reduce((acc, c) => {
    acc[c.estado] = (acc[c.estado] || 0) + 1;
    return acc;
  }, {});

  async function guardarCliente(datos) {
    if (clienteSeleccionado) {
      await updateDoc(doc(db, "licencias", clienteSeleccionado.id), { ...datos, actualizadoEn: serverTimestamp() });
    } else {
      const ref = doc(collection(db, "licencias"));
      await setDoc(ref, { ...datos, creadoEn: serverTimestamp() });
    }
    setModalAbierto(false);
  }

  async function cambiarEstado(cliente, nuevoEstado) {
    await updateDoc(doc(db, "licencias", cliente.id), { estado: nuevoEstado, actualizadoEn: serverTimestamp() });
  }

  async function eliminarCliente(cliente) {
    if (!confirm(`¿Eliminar a ${cliente.nombre}?`)) return;
    await deleteDoc(doc(db, "licencias", cliente.id));
    setModalAbierto(false);
  }

  return (
    <div className="min-h-screen bg-carbon">
      {/* Header */}
      <header className="border-b border-steel/30 bg-carbon-surface/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-flex rounded-lg flex items-center justify-center">
              <span className="font-display text-white text-xs">FM</span>
            </div>
            <div>
              <h1 className="font-display text-xl text-bone uppercase tracking-wide">
                Flex<span className="text-flex-glow">Manager</span>
              </h1>
              <p className="text-xs text-bone-dim">Super Admin · {perfil?.nombre}</p>
            </div>
          </div>
          <button onClick={cerrarSesion} className="text-sm text-bone-dim hover:text-blood-glow font-medium px-3 py-1.5 rounded-lg border border-steel/40 hover:border-blood/40 transition-colors">
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6 pb-24">

        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total clientes" valor={clientes.length} color="text-bone" />
          <StatCard label="En prueba" valor={conteos.prueba || 0} color="text-flex-glow" />
          <StatCard label="Activos" valor={conteos.activa || 0} color="text-emerald-400" />
          <StatCard label="Vencidos" valor={(conteos.vencida || 0) + (conteos.suspendida || 0)} color="text-blood-glow" />
        </div>

        {/* Filtros */}
        <div className="space-y-3">
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cliente..." className="campo-input" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["todos", "prueba", "activa", "vencida", "suspendida"].map(estado => (
              <button key={estado} onClick={() => setFiltroEstado(estado)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${
                  filtroEstado === estado
                    ? "bg-flex/15 border-flex/40 text-flex-glow"
                    : "bg-carbon-raised border-steel/40 text-bone-dim hover:border-steel-light"
                }`}>
                {estado === "todos" ? `Todos (${clientes.length})` : ESTADO_CONFIG[estado]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de clientes */}
        {cargando ? (
          <p className="text-center text-bone-dim py-10">Cargando clientes...</p>
        ) : clientesFiltrados.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-steel/40 rounded-xl">
            <p className="text-bone-dim">{clientes.length === 0 ? "Aún no hay clientes registrados." : "No se encontraron clientes."}</p>
            {clientes.length === 0 && (
              <button onClick={() => { setClienteSeleccionado(null); setModalAbierto(true); }}
                className="mt-4 text-flex-glow font-medium underline">
                Agregar el primero
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {clientesFiltrados.map(cliente => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                onEditar={() => { setClienteSeleccionado(cliente); setModalAbierto(true); }}
                onCambiarEstado={cambiarEstado}
              />
            ))}
          </div>
        )}
      </main>

      {/* Botón agregar */}
      <button
        onClick={() => { setClienteSeleccionado(null); setModalAbierto(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-flex hover:bg-flex-glow text-white shadow-lg flex items-center justify-center transition-transform active:scale-90 z-30"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {modalAbierto && (
        <ClienteFormModal
          clienteExistente={clienteSeleccionado}
          onClose={() => setModalAbierto(false)}
          onSave={guardarCliente}
          onDelete={eliminarCliente}
        />
      )}
    </div>
  );
}

function ClienteCard({ cliente, onEditar, onCambiarEstado }) {
  const config = ESTADO_CONFIG[cliente.estado] || ESTADO_CONFIG.suspendida;
  const dias = diasRestantes(cliente.fechaVencimiento);

  return (
    <div className="bg-carbon-surface border border-steel/40 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-bone text-lg tracking-wide">{cliente.nombre}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${config.color}`}>
              {config.label}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full border border-steel/40 text-bone-dim">
              {cliente.tipo}
            </span>
          </div>

          {cliente.url && (
            <a href={`https://${cliente.url}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-flex-glow hover:underline mt-1 block">
              🔗 {cliente.url}
            </a>
          )}

          {cliente.adminEmail && (
            <p className="text-xs text-bone-dim mt-0.5">📧 {cliente.adminEmail}</p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-bone-dim">
            <span>Inicio: {cliente.fechaInicio}</span>
            <span>Vence: {cliente.fechaVencimiento}</span>
            {dias !== null && (
              <span className={dias < 0 ? "text-blood-glow" : dias <= 5 ? "text-amberwarn-glow" : "text-emerald-400"}>
                {dias < 0 ? `Venció hace ${Math.abs(dias)} días` : dias === 0 ? "Vence hoy" : `${dias} días restantes`}
              </span>
            )}
          </div>

          {cliente.notas && <p className="text-xs text-bone-dim mt-1 italic">"{cliente.notas}"</p>}
        </div>

        <button onClick={onEditar} className="shrink-0 text-bone-dim hover:text-bone p-1.5 rounded-lg border border-steel/40 hover:border-steel-light transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* Botones de acción rápida */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {cliente.estado !== "activa" && (
          <button onClick={() => onCambiarEstado(cliente, "activa")}
            className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors">
            ✓ Activar
          </button>
        )}
        {cliente.estado !== "prueba" && (
          <button onClick={() => onCambiarEstado(cliente, "prueba")}
            className="text-xs px-3 py-1.5 rounded-lg border border-flex/30 text-flex-glow hover:bg-flex/10 transition-colors">
            🔄 Modo prueba
          </button>
        )}
        {cliente.estado !== "suspendida" && (
          <button onClick={() => onCambiarEstado(cliente, "suspendida")}
            className="text-xs px-3 py-1.5 rounded-lg border border-blood/30 text-blood-glow hover:bg-blood/10 transition-colors">
            ⏸ Suspender
          </button>
        )}
        {cliente.url && (
          <a href={`https://${cliente.url}`} target="_blank" rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg border border-steel/40 text-bone-dim hover:border-steel-light transition-colors">
            🌐 Abrir sitio
          </a>
        )}
      </div>
    </div>
  );
}

function ClienteFormModal({ clienteExistente, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(clienteExistente ? { ...VACIO, ...clienteExistente } : VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const esEdicion = Boolean(clienteExistente);

  function actualizar(campo, valor) { setForm(prev => ({ ...prev, [campo]: valor })); }

  function manejarDiasPrueba(dias) {
    setForm(prev => ({ ...prev, fechaInicio: hoyISO(), fechaVencimiento: sumarDias(dias) }));
  }

  async function manejarGuardar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setGuardando(true);
    try { await onSave(form); }
    catch (err) { setError(err.message || "Error al guardar."); setGuardando(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-carbon-surface border border-steel/40 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-carbon-surface border-b border-steel/30 px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-bone uppercase tracking-wide">
            {esEdicion ? "Editar cliente" : "Nuevo cliente"}
          </h2>
          <button onClick={onClose} className="text-bone-dim hover:text-bone p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={manejarGuardar} className="p-5 space-y-4">
          <Campo label="Nombre del negocio">
            <input required value={form.nombre} onChange={(e) => actualizar("nombre", e.target.value)}
              className="campo-input" placeholder="Ej. Gym Guerra Fitness Center" />
          </Campo>

          <Campo label="Tipo de negocio">
            <select value={form.tipo} onChange={(e) => actualizar("tipo", e.target.value)} className="campo-input">
              {TIPOS_NEGOCIO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Campo>

          <Campo label="URL del sitio">
            <input value={form.url} onChange={(e) => actualizar("url", e.target.value)}
              className="campo-input" placeholder="gymguerra.netlify.app" />
          </Campo>

          <Campo label="Correo del administrador">
            <input type="email" value={form.adminEmail} onChange={(e) => actualizar("adminEmail", e.target.value)}
              className="campo-input" placeholder="admin@negocio.com" />
          </Campo>

          <Campo label="Estado de la licencia">
            <div className="grid grid-cols-2 gap-2">
              {ESTADOS.map(estado => (
                <button key={estado} type="button" onClick={() => actualizar("estado", estado)}
                  className={`py-2.5 rounded-lg font-medium text-sm border transition-colors ${
                    form.estado === estado
                      ? "bg-flex/15 border-flex text-flex-glow"
                      : "bg-carbon-raised border-steel/50 text-bone-dim hover:border-steel-light"
                  }`}>
                  {ESTADO_CONFIG[estado]?.label}
                </button>
              ))}
            </div>
          </Campo>

          <Campo label="Duración rápida">
            <div className="flex gap-2 flex-wrap">
              {[7, 15, 30, 60, 90].map(dias => (
                <button key={dias} type="button" onClick={() => manejarDiasPrueba(dias)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-steel/40 text-bone-dim hover:border-flex hover:text-flex-glow transition-colors">
                  {dias} días
                </button>
              ))}
            </div>
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Fecha inicio">
              <input type="date" value={form.fechaInicio} onChange={(e) => actualizar("fechaInicio", e.target.value)} className="campo-input" />
            </Campo>
            <Campo label="Fecha vencimiento">
              <input type="date" value={form.fechaVencimiento} onChange={(e) => actualizar("fechaVencimiento", e.target.value)} className="campo-input" />
            </Campo>
          </div>

          <Campo label="Notas internas (opcional)">
            <textarea value={form.notas} onChange={(e) => actualizar("notas", e.target.value)}
              className="campo-input resize-none" rows={2} placeholder="Notas sobre este cliente..." />
          </Campo>

          {error && <p className="text-sm text-blood-glow bg-blood/10 border border-blood/30 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            {esEdicion && (
              <button type="button" onClick={() => onDelete(clienteExistente)}
                className="flex-1 bg-transparent border border-blood/40 text-blood-glow hover:bg-blood/10 font-medium py-3 rounded-lg transition-colors">
                Eliminar
              </button>
            )}
            <button type="submit" disabled={guardando}
              className="flex-1 bg-flex hover:bg-flex-glow disabled:opacity-50 text-white font-display font-semibold uppercase tracking-wide py-3 rounded-lg transition-all active:scale-[0.98]">
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({ label, valor, color }) {
  return (
    <div className="bg-carbon-surface border border-steel/40 rounded-xl p-4 text-center">
      <p className={`font-display text-2xl ${color}`}>{valor}</p>
      <p className="text-xs text-bone-dim mt-0.5">{label}</p>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-bone-dim uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}
