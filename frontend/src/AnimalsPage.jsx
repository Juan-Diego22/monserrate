import { useState, useEffect } from "react";
import "./AnimalsPage.css";
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';

// URL base de la API — ajusta si usas proxy o variable de entorno
const API_BASE = "/api";   // con proxy Vite; o "http://localhost:8000/api" en dev directo

// Configuración de estados (espeja ESTADO_CHOICES de Django) 
const ESTADO_CONFIG = {
  TERNERA: { label: "Ternera", color: "amber" },
  NOVILLA: { label: "Novilla", color: "teal" },
  VACA_PRODUCCION: { label: "Vaca en producción", color: "green" },
  SECA: { label: "Vaca seca", color: "blue" },
  DESCARTADA: { label: "Descartada", color: "gray" },
};

// Helpers 
function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let años = hoy.getFullYear() - nac.getFullYear();
  let meses = hoy.getMonth() - nac.getMonth();
  if (meses < 0) { años--; meses += 12; }
  return `${años}a ${meses}m`;
}

function initials(chapeta) {
  return `#${chapeta.padStart(3, "0")}`;
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
 
// Modal de detalle 
function AnimalModal({ animal, onClose }) {
  const cfg = ESTADO_CONFIG[animal.estado_actual];
 
  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
 
  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
 
        {/* Header */}
        <div className="ap-modal-header">
          <div className={`ap-modal-avatar ap-avatar--${cfg.color}`}>
            {initials(animal.chapeta)}
          </div>
          <div className="ap-modal-header-info">
            <h2 className="ap-modal-title">Chapeta {animal.chapeta}</h2>
            <span className={`ap-pill ap-pill--${cfg.color}`}>{cfg.label}</span>
            {!animal.activa && (
              <span className="ap-pill ap-pill--gray ap-pill--sm">Inactiva</span>
            )}
          </div>
          <button className="ap-modal-close" onClick={onClose} aria-label="Cerrar">
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
 
        {/* Cuerpo */}
        <div className="ap-modal-body">
          <div className="ap-modal-section">
            <p className="ap-modal-section-title">Información general</p>
            <div className="ap-modal-grid">
              <div className="ap-modal-field">
                <span className="ap-modal-label">Chapeta</span>
                <span className="ap-modal-value">{animal.chapeta}</span>
              </div>
              <div className="ap-modal-field">
                <span className="ap-modal-label">Sexo</span>
                <span className="ap-modal-value">
                  {animal.sexo === "HEMBRA" ? "Hembra" : "Macho"}
                </span>
              </div>
              <div className="ap-modal-field">
                <span className="ap-modal-label">Fecha de nacimiento</span>
                <span className="ap-modal-value">{formatFecha(animal.fecha_nacimiento)}</span>
              </div>
              <div className="ap-modal-field">
                <span className="ap-modal-label">Edad</span>
                <span className="ap-modal-value">{calcularEdad(animal.fecha_nacimiento)}</span>
              </div>
              <div className="ap-modal-field">
                <span className="ap-modal-label">Estado actual</span>
                <span className="ap-modal-value">{cfg.label}</span>
              </div>
              <div className="ap-modal-field">
                <span className="ap-modal-label">Activa</span>
                <span className="ap-modal-value">{animal.activa ? "Sí" : "No"}</span>
              </div>
            </div>
          </div>
 
          <div className="ap-modal-section">
            <p className="ap-modal-section-title">Genealogía</p>
            <div className="ap-modal-grid">
              <div className="ap-modal-field">
                <span className="ap-modal-label">Padre</span>
                <span className="ap-modal-value">{animal.padre_nombre || "—"}</span>
              </div>
              {animal.madre_chapeta && (
                <div className="ap-modal-field">
                  <span className="ap-modal-label">Madre (chapeta)</span>
                  <span className="ap-modal-value">{animal.madre_chapeta}</span>
                </div>
              )}
              {animal.raza && (
                <div className="ap-modal-field">
                  <span className="ap-modal-label">Raza</span>
                  <span className="ap-modal-value">{animal.raza}</span>
                </div>
              )}
            </div>
          </div>
 
          {/* Sección extra: muestra cualquier campo adicional que venga de la API */}
          {(animal.peso || animal.observaciones) && (
            <div className="ap-modal-section">
              <p className="ap-modal-section-title">Datos adicionales</p>
              <div className="ap-modal-grid">
                {animal.peso && (
                  <div className="ap-modal-field">
                    <span className="ap-modal-label">Peso</span>
                    <span className="ap-modal-value">{animal.peso} kg</span>
                  </div>
                )}
                {animal.observaciones && (
                  <div className="ap-modal-field ap-modal-field--full">
                    <span className="ap-modal-label">Observaciones</span>
                    <span className="ap-modal-value">{animal.observaciones}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
 
        {/* Footer */}
        <div className="ap-modal-footer">
          <button className="ap-modal-btn-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
 
      </div>
    </div>
  );
}

// Componente principal 
export default function AnimalesPage() {
  const [animales, setAnimales] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);

  // El ViewSet devuelve la lista ordenada por -id (más reciente primero)
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/animals/`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",   // envía cookie de sesión Django si la usas
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        // Soporta respuesta paginada { results: [...] } y array plano
        const lista = Array.isArray(data) ? data : (data.results ?? []);
        setAnimales(lista);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Conteos por estado 
  const conteos = animales.reduce((acc, a) => {
    acc[a.estado_actual] = (acc[a.estado_actual] || 0) + 1;
    return acc;
  }, {});

  // Filtrado 
  const filtrados = animales.filter((a) => {
    const matchEstado = filtroEstado === "TODOS" || a.estado_actual === filtroEstado;
    const q = busqueda.toLowerCase();
    const matchBusqueda =
      !q ||
      a.chapeta.toLowerCase().includes(q) ||
      a.padre_nombre.toLowerCase().includes(q);
    return matchEstado && matchBusqueda;
  });

  return (
    <div className="ap-page">

      {/* Modal — se renderiza encima de todo cuando hay un animal seleccionado */}
      {animalSeleccionado && (
        <AnimalModal
          animal={animalSeleccionado}
          onClose={() => setAnimalSeleccionado(null)}
        />
      )}

      {/* Header */}
      <div className="ap-header">
        <div>
          <h1 className="ap-title">Animales registrados</h1>
          <p className="ap-subtitle">
            {filtrados.length} {filtrados.length === 1 ? "animal" : "animales"}{" "}
            {filtroEstado !== "TODOS" && `· ${ESTADO_CONFIG[filtroEstado]?.label}`}
          </p>
        </div>

      </div>

      {/* Búsqueda */}
      <div className="ap-search-wrap">
        <span className="ap-search-icon">
          <SearchIcon sx={{ fontSize: 18 }}/>
        </span>
        <input
          className="ap-search"
          type="text"
          placeholder="Buscar por chapeta o padre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button className="ap-search-clear" onClick={() => setBusqueda("")}>✕</button>
        )}
      </div>

      {/* Filtros por estado */}
      <div className="ap-filters">
        <button
          className={`ap-filter-btn ${filtroEstado === "TODOS" ? "active todos" : ""}`}
          onClick={() => setFiltroEstado("TODOS")}
        >
          Todos
          <span className="ap-filter-count">{animales.length}</span>
        </button>

        {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            className={`ap-filter-btn ${filtroEstado === key ? `active ${cfg.color}` : ""}`}
            onClick={() => setFiltroEstado(key)}
          >
            <span className={`ap-dot ap-dot--${cfg.color}`} />
            {cfg.label}
            <span className="ap-filter-count">{conteos[key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="ap-empty">
          <div className="ap-spinner" />
          <p>Cargando animales…</p>
        </div>
      ) : error ? (
        <div className="ap-empty ap-empty--error">
          <p>No se pudo cargar la lista de animales.</p>
          <code className="ap-error-msg">{error}</code>
          <button className="ap-link" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="ap-empty">
          <p>No se encontraron animales con estos filtros.</p>
          <button className="ap-link" onClick={() => { setFiltroEstado("TODOS"); setBusqueda(""); }}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <ul className="ap-list">
          {filtrados.map((animal) => {
            const cfg = ESTADO_CONFIG[animal.estado_actual];
            return (
              <li 
                key={animal.id}  
                className="ap-card"
                onClick={() => setAnimalSeleccionado(animal)}
                style={{  cursor: "pointer" }}
              >
                <div className={`ap-avatar ap-avatar--${cfg.color}`}>
                  {initials(animal.chapeta)}
                </div>

                <div className="ap-card-info">
                  <span className="ap-card-nombre">Chapeta {animal.chapeta}</span>
                  <span className="ap-card-meta">
                    {calcularEdad(animal.fecha_nacimiento)}
                    &nbsp;·&nbsp;
                    {animal.sexo === "HEMBRA" ? "Hembra" : "Macho"}
                    &nbsp;·&nbsp;
                    Padre: {animal.padre_nombre}
                  </span>
                </div>

                <div className="ap-card-right">
                  <span className={`ap-pill ap-pill--${cfg.color}`}>{cfg.label}</span>
                  {!animal.activa && (
                    <span className="ap-pill ap-pill--gray ap-pill--sm">Inactiva</span>
                  )}
                </div>

                <button
                  className="ap-card-arrow"
                  aria-label="Ver detalle"
                  onClick={(e) => {
                    e.stopPropagation(); // evita doble disparo con el onClick del <li>
                    setAnimalSeleccionado(animal);
                  }}
                >
                  ›
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}