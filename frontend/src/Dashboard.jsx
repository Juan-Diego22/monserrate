import { useState } from "react";
import "./Dashboard.css";
import RegistrarAnimal from "./RegistrarAnimal";
import { 
  Dashboard as DashboardIcon, Pets as PetsIcon, 
  CalendarMonth as CalendarMonthIcon, PrecisionManufacturing as ManufacturingIcon,
  DensityMedium as SideBar, Settings as SettingsIcon, Moving as MovingIcon,
  FavoriteBorder as FavoriteIcon, Leaderboard as LeaderboardIcon, 
  Info as InfoIcon
} from '@mui/icons-material';

const ESTADO_LABEL = {
  VACA_PRODUCCION: "En Producción",
  NOVILLA: "Novilla",
  SECA: "Seca",
  TERNERA: "Ternera",
  DESCARTADA: "Descartada",
};

/* Sidebar */
function Sidebar({ activeNav, setActiveNav }) {
  const items = [
    {
      key: "dashboard", label: "Dashboard",
      icon: <DashboardIcon sx={{ fontSize: 18, color: 'black' }} />
    },
    {
      key: "animales", label: "Animales",
      icon: <PetsIcon sx={{ fontSize: 18 }} />,
    },
    {
      key: "reproduccion", label: "Reproducción",
      icon: <CalendarMonthIcon sx={{ fontSize: 18 }} />
    },
    {
      key: "produccion", label: "Producción",
      icon: <ManufacturingIcon sx={{ fontSize: 18 }} />,
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <SideBar sx={{ fontSize: 18, color: 'white' }} />
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
          <SettingsIcon sx={{ fontSize: 18 }} />
          Configuración
        </button>
      </div>
    </aside>
  );
}

/* StatCard */
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

/* Dashboard view */
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
            <SideBar sx={{ fontSize: 18, color: 'blue' }} />
          }
        />
        <StatCard
          label="En Producción"
          value={enProduccion}
          valueClass="stat-card__value--green"
          iconClass="stat-card__icon--green"
          icon={
            <MovingIcon sx={{ fontSize: 18, color: 'green' }} />
          }
        />
        <StatCard
          label="Vacas Secas"
          value={vacasSecas}
          valueClass="stat-card__value--orange"
          iconClass="stat-card__icon--orange"
          icon={
            <FavoriteIcon sx={{ fontSize: 18, color: 'orange' }} />
          }
        />
        <StatCard
          label="Promedio Litros"
          value={promLitros > 0 ? promLitros.toFixed(1) : "—"}
          valueClass="stat-card__value--blue"
          iconClass="stat-card__icon--blue"
          icon={
            <LeaderboardIcon sx={{ fontSize: 18, color: 'blue' }} />
          }
        />
      </div>

      {/* Próximos eventos */}
      {hayEventos > 0 && (
        <div className="eventos-banner">
          <div className="eventos-banner__title">
            <InfoIcon sx={{ fontSize: 18 }} />
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