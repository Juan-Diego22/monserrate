import { useState } from "react";
import "./Dashboard.css";
import RegistrarAnimal from "./RegistrarAnimal";

const ESTADO_LABEL = {
  VACA_PRODUCCION: "En Producción",
  NOVILLA: "Novilla",
  SECA: "Seca",
  TERNERA: "Ternera",
  DESCARTADA: "Descartada",
};

/* ─── Sidebar ─── */
function Sidebar({ activeNav, setActiveNav }) {
  const items = [
    {
      key: "dashboard", label: "Dashboard",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
      ),
    },
    {
      key: "animales", label: "Animales",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
      ),
    },
    {
      key: "reproduccion", label: "Reproducción",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      key: "produccion", label: "Producción",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </div>
        <div>
          <div className="sidebar__brand-name">GanApp</div>
          <div className="sidebar__brand-sub">Gestión Ganadera</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => {
          const active = activeNav === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveNav(item.key)}
              className={`sidebar__nav-btn${active ? " sidebar__nav-btn--active" : ""}`}
            >
              <span className="sidebar__nav-icon">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <button
          onClick={() => setActiveNav("configuracion")}
          className={`sidebar__config-btn${activeNav === "configuracion" ? " sidebar__config-btn--active" : ""}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
          Configuración
        </button>
      </div>
    </aside>
  );
}

/* ─── StatCard ─── */
function StatCard({ label, value, valueClass, iconClass, icon }) {
  return (
    <div className="stat-card">
      <div>
        <div className="stat-card__label">{label}</div>
        <div className={`stat-card__value ${valueClass || ""}`}>{value}</div>
      </div>
      <div className={`stat-card__icon ${iconClass}`}>{icon}</div>
    </div>
  );
}

/* ─── Dashboard view ─── */
function DashboardView({ animales, onRegistrar }) {
  const enProduccion = animales.filter(a => a.estado_actual === "VACA_PRODUCCION").length;
  const vacasSecas   = animales.filter(a => a.estado_actual === "SECA").length;
  const conLitros    = animales.filter(a => a.litros_promedio);
  const promLitros   = conLitros.length
    ? conLitros.reduce((acc, a) => acc + a.litros_promedio, 0) / conLitros.length
    : 0;

  const distribucion = [
    { label: "Ternera", count: animales.filter(a => a.estado_actual === "TERNERA").length },
    { label: "Novilla", count: animales.filter(a => a.estado_actual === "NOVILLA").length },
    { label: "En Producción", count: enProduccion },
    { label: "Seca", count: vacasSecas },
    { label: "Descartada", count: animales.filter(a => a.estado_actual === "DESCARTADA").length },
  ];

  const conParto = animales.filter(a => a.proximo_parto);
  const conDiagnostico = animales.filter(a => a.estado_actual === "NOVILLA");
  const conVacunacion = animales.filter(a => a.vacunacion);
  const hayEventos = conParto.length || conDiagnostico.length || conVacunacion.length;

  return (
    <div className="dashboard-view">

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          label="Total Animales"
          value={animales.length}
          iconClass="stat-card__icon--blue"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          }
        />
        <StatCard
          label="En Producción"
          value={enProduccion}
          valueClass="stat-card__value--green"
          iconClass="stat-card__icon--green"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          }
        />
        <StatCard
          label="Vacas Secas"
          value={vacasSecas}
          valueClass="stat-card__value--orange"
          iconClass="stat-card__icon--orange"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          }
        />
        <StatCard
          label="Promedio Litros"
          value={promLitros > 0 ? promLitros.toFixed(1) : "—"}
          valueClass="stat-card__value--blue"
          iconClass="stat-card__icon--blue"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          }
        />
      </div>

      {/* Próximos eventos */}
      {hayEventos > 0 && (
        <div className="eventos-banner">
          <div className="eventos-banner__title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Próximos eventos importantes
          </div>
          <ul className="eventos-banner__list">
            {conParto.map(a => (
              <li key={a.id + "-parto"} className="eventos-banner__item">
                • Chapeta {a.chapeta} - Próximo parto estimado: {a.proximo_parto}
              </li>
            ))}
            {conDiagnostico.map(a => (
              <li key={a.id + "-diag"} className="eventos-banner__item">
                • Chapeta {a.chapeta} - Diagnóstico de preñez pendiente
              </li>
            ))}
            {conVacunacion.map(a => (
              <li key={a.id + "-vac"} className="eventos-banner__item">
                • Chapeta {a.chapeta} - Vacunación programada: {a.vacunacion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {animales.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">🐄</div>
          <div className="empty-state__title">No hay animales registrados</div>
          <div className="empty-state__subtitle">
            Haz clic en <strong>+ Registrar Animal</strong> para comenzar.
          </div>
          <button className="btn-registrar" onClick={onRegistrar}>
            + Registrar Animal
          </button>
        </div>
      )}

      {/* Distribución por estado */}
      {animales.length > 0 && (
        <div className="distribucion-card">
          <div className="distribucion-card__title">Distribución por Estado</div>
          <div className="distribucion-grid">
            {distribucion.map((d) => (
              <div key={d.label} className="distribucion-item">
                <div className="distribucion-item__count">{d.count}</div>
                <div className="distribucion-item__label">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimos animales */}
      {animales.length > 0 && (
        <div className="ultimos-card">
          <div className="ultimos-card__header">
            <div className="ultimos-card__title">Últimos Animales Registrados</div>
            <button className="ultimos-card__ver-todos">Ver todos ›</button>
          </div>
          <div>
            {[...animales].reverse().slice(0, 5).map((a) => (
              <div key={a.id} className="animal-row">
                <div className="animal-row__avatar">#{a.chapeta}</div>
                <div className="animal-row__info">
                  <div className="animal-row__nombre">Chapeta {a.chapeta}</div>
                  <div className="animal-row__meta">
                    {a.edad || "—"} — {ESTADO_LABEL[a.estado_actual] || a.estado_actual}
                  </div>
                </div>
                <span className={`animal-row__badge badge--${a.estado_actual}`}>
                  {ESTADO_LABEL[a.estado_actual] || a.estado_actual}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

/* Export principal */
export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [animales,  setAnimales]  = useState([]);
  const [showModal, setShowModal] = useState(false);

  const handleGuardar = (nuevoAnimal) => {
    const conId = { ...nuevoAnimal, id: Date.now() };
    setAnimales(prev => [...prev, conId]);
    setShowModal(false);
  };

  return (
    <div className="app">
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

      <div className="main">
        <div className="page-header">
          <div>
            <h1 className="page-title">Panel Principal</h1>
            <p className="page-subtitle">Gestión integral de ganado lechero</p>
          </div>
          <button className="btn-registrar" onClick={() => setShowModal(true)}>
            + Registrar Animal
          </button>
        </div>

        <div className="content">
          {activeNav === "dashboard" && <DashboardView animales={animales} onRegistrar={() => setShowModal(true)} />}
          {activeNav === "animales" && <div className="placeholder-section">Módulo Animales — próximamente</div>}
          {activeNav === "reproduccion" && <div className="placeholder-section">Módulo Reproducción — próximamente</div>}
          {activeNav === "produccion" && <div className="placeholder-section">Módulo Producción — próximamente</div>}
          {activeNav === "configuracion" && <div className="placeholder-section">Configuración — próximamente</div>}
        </div>
      </div>

      {showModal && (
        <RegistrarAnimal
          animales={animales}
          onClose={() => setShowModal(false)}
          onGuardar={handleGuardar}
        />
      )}
    </div>
  );
}