import { useState } from "react";
import "./dashboard.css";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

const estadoLabel = {
  VACA_PRODUCCION: "Vaca Producción",
  TERNERA:         "Ternera",
  NOVILLA:         "Novilla",
  SECA:            "Vaca Seca",
  TORO:            "Toro",
  DESCARTADA:      "Descartada",
};

const tipoEventoIcon = {
  parto:        "🐄",
  inseminacion: "🔬",
  monta:        "🐂",
  diagnostico:  "🩺",
};

const tipoEventoColor = {
  parto:        "#2d7a3a",
  inseminacion: "#b7791f",
  monta:        "#1a5276",
  diagnostico:  "#7b3f9e",
};

const FILTER_KEYS = {
  Todos:            null,
  Vacas:            "VACA_PRODUCCION",
  Terneros:         "TERNERA",
  Toros:            "TORO",
  "En Tratamiento": "SECA",
};

const filterClass = {
  Todos:            "todos",
  Vacas:            "vacas",
  Terneros:         "terneros",
  Toros:            "toros",
  "En Tratamiento": "tratamiento",
};

function formatDate(dateStr) {
  if (!dateStr) return "Sin registro";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function calcProximoParto(reproducciones = []) {
  const ultimoParto = reproducciones.find((r) => r.tipo === "parto");
  if (!ultimoParto) return "N/A";
  return formatDate(
    new Date(new Date(ultimoParto.fecha_evento).getTime() + 285 * 86400000)
  );
}

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon}</span>
      <span className="empty-state__title">{title}</span>
      {subtitle && <span className="empty-state__subtitle">{subtitle}</span>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ANIMAL AVATAR
───────────────────────────────────────────── */

function AnimalAvatar({ color = "#8B6914", size = 44 }) {
  return (
    <div
      className="animal-avatar"
      style={{
        width:     size,
        height:    size,
        background: `linear-gradient(135deg,${color}cc,${color}55)`,
        border:    `2.5px solid ${color}`,
        fontSize:  size * 0.42,
        boxShadow: `0 2px 8px ${color}44`,
      }}
    >
      🐄
    </div>
  );
}

/* ─────────────────────────────────────────────
   WEIGHT BAR
───────────────────────────────────────────── */

function WeightBar({ weight, color = "#8B6914", max = 800 }) {
  const pct = Math.min(((weight || 0) / max) * 100, 100);
  return (
    <div className="weight-bar">
      <div className="weight-bar__track">
        <div
          className="weight-bar__fill"
          style={{
            width:      `${pct}%`,
            background: `linear-gradient(90deg,${color},${color}bb)`,
          }}
        />
      </div>
      <span className="weight-bar__label">{weight ?? "—"} kg</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */

function Sidebar({ activeNav, setActiveNav }) {
  const navItems = [
    { key: "dashboard",     label: "Dashboard",     icon: "🏠" },
    { key: "inventario",    label: "Inventario",    icon: "📋" },
    { key: "alertas",       label: "Alertas",       icon: "🔔" },
    { key: "configuracion", label: "Configuración", icon: "⚙️" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">🐄</div>
        <div>
          <div className="sidebar__farm-name">Finca</div>
          <div className="sidebar__farm-sub">La Esperanza</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveNav(item.key)}
            className={`sidebar__nav-btn${
              activeNav === item.key ? " sidebar__nav-btn--active" : ""
            }`}
          >
            <span className="sidebar__nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__user">
        <div className="sidebar__avatar">👤</div>
        <div>
          <div className="sidebar__user-name">Usuario</div>
          <div className="sidebar__user-role">Finca</div>
        </div>
        <div className="sidebar__status-dot" />
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────
   TOP BAR
───────────────────────────────────────────── */

function TopBar({ online, pendingCount }) {
  return (
    <div className="topbar">
      <div
        className={`topbar__status topbar__status--${
          online ? "online" : "offline"
        }`}
      >
        <div
          className={`topbar__dot topbar__dot--${
            online ? "pending" : "offline"
          }`}
        />
        <span
          className={`topbar__label--${online ? "online" : "offline"}`}
        >
          {online ? "ONLINE" : "OFFLINE"}
        </span>
        {pendingCount > 0 && (
          <>
            <span className="topbar__pending-text">
              — {pendingCount} eventos pendientes
            </span>
            <span className="topbar__sync-icon">🔄</span>
          </>
        )}
      </div>

      <div className="topbar__right">
        <div className="topbar__online-group">
          <div className="topbar__dot topbar__dot--online" />
          <span className="topbar__label--online">ONLINE</span>
          <span className="topbar__divider">|</span>
          <div className="topbar__dot topbar__dot--yellow" />
          <span className="topbar__changes-text">Cambios pendientes</span>
        </div>
        <button className="topbar__settings-btn">⚙️</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ANIMAL CARD
───────────────────────────────────────────── */

function AnimalCard({ animal, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`animal-card${selected ? " animal-card--selected" : ""}`}
    >
      <AnimalAvatar color={animal.color} size={46} />
      <div className="animal-card__info">
        <div className="animal-card__header">
          <span className="animal-card__name">{animal.nombre}</span>
          {animal.gestante && (
            <span className="animal-card__badge">Gestante</span>
          )}
        </div>
        <div className="animal-card__estado">
          {estadoLabel[animal.estado_actual] || animal.estado_actual}
        </div>
        <WeightBar weight={animal.ultimo_peso} color={animal.color} />
      </div>
      <button className="animal-card__menu-btn">⋮</button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   REPRODUCTION TIMELINE
───────────────────────────────────────────── */

function ReproduccionTimeline({ reproducciones }) {
  if (!reproducciones?.length) {
    return (
      <EmptyState icon="📋" title="Sin eventos registrados" />
    );
  }

  return (
    <div className="timeline">
      {reproducciones.map((r, i) => (
        <div key={i} className="timeline-item">
          <div
            className="timeline-item__dot"
            style={{
              background:   `${tipoEventoColor[r.tipo]}22`,
              borderColor:  tipoEventoColor[r.tipo],
            }}
          >
            {tipoEventoIcon[r.tipo]}
          </div>
          <div>
            <span className="timeline-item__year">
              {new Date(r.fecha_evento).getFullYear()}
            </span>
            <span className="timeline-item__type">
              {r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1)}
              {r.toro ? ` — ${r.toro}` : ""}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ANIMAL DETAIL
───────────────────────────────────────────── */

function AnimalDetail({ animal }) {
  const [activeTab, setActiveTab] = useState("reproduccion");
  const tabs = ["reproduccion", "historial", "pedigree"];

  const ultimoParto = animal.reproducciones?.find((r) => r.tipo === "parto");
  const servicios   = animal.reproducciones?.filter((r) =>
    ["inseminacion", "monta"].includes(r.tipo)
  ).length ?? 0;

  return (
    <div className="detail-panel">
      {/* Hero */}
      <div className="detail-panel__hero">
        <div className="detail-panel__hero-bg" />
        <div className="detail-panel__hero-label">
          <span className="detail-panel__hero-name">
            ID {animal.chapeta} — {animal.nombre}
          </span>
          <div className="detail-panel__hero-status" />
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`detail-tab${
              activeTab === tab ? " detail-tab--active" : ""
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="detail-content">
        {activeTab === "reproduccion" && (
          <>
            {[
              {
                label: "Último Parto",
                value: ultimoParto
                  ? formatDate(ultimoParto.fecha_evento)
                  : "Sin registro",
              },
              {
                label: "Próximo Estimado",
                value: calcProximoParto(animal.reproducciones),
              },
              { label: "Servicios Realizados", value: servicios },
            ].map((item, i) => (
              <div key={i} className="repro-row">
                <span className="repro-row__label">{item.label}:</span>
                <span className="repro-row__value">{item.value}</span>
              </div>
            ))}
            <ReproduccionTimeline reproducciones={animal.reproducciones} />
          </>
        )}

        {activeTab === "historial" && (
          <ReproduccionTimeline reproducciones={animal.reproducciones} />
        )}

        {activeTab === "pedigree" && (
          <div className="pedigree-section">
            <div className="pedigree-section__label">Padre</div>
            <div className="pedigree-card">
              <span className="pedigree-card__name">
                {animal.padre_nombre || "Sin registro"}
              </span>
            </div>
            <div className="pedigree-section__label">Madre</div>
            <div className="pedigree-card">
              <span className="pedigree-card__name">
                {animal.madre_nombre || "Sin registro"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   NUEVO EVENTO PANEL
───────────────────────────────────────────── */

function NuevoEventoPanel({ animals, onClose, onSave }) {
  const eventTypes = [
    { key: "nacimiento",  label: "Nacimiento",  icon: "🐣" },
    { key: "pesaje",      label: "Pesaje",       icon: "⚖️" },
    { key: "tratamiento", label: "Tratamiento",  icon: "💉" },
  ];

  const [tipoEvento, setTipoEvento] = useState("pesaje");
  const [form, setForm] = useState({
    animalId:     "",
    fecha:        new Date().toLocaleDateString("es-CO"),
    peso:         "",
    sexoCria:     "",
    observaciones:"",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (tipoEvento === "pesaje") {
      if (!form.peso || isNaN(form.peso)) {
        setError("Ingrese un peso válido.");
        return;
      }
      if (Number(form.peso) < 10 || Number(form.peso) > 1200) {
        setError("Peso fuera de rango válido.");
        return;
      }
    }
    if (tipoEvento === "nacimiento" && !form.sexoCria) {
      setError("Seleccione el sexo de la cría.");
      return;
    }
    setError("");
    onSave?.({ tipoEvento, ...form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="event-panel">
      {/* Header */}
      <div className="event-panel__header">
        <button className="event-panel__back-btn" onClick={onClose}>
          ‹
        </button>
        <span className="event-panel__title">Nuevo Evento</span>
        <button className="event-panel__settings-btn">⚙️</button>
      </div>

      {/* Type selector */}
      <div className="event-types">
        {eventTypes.map((et) => (
          <button
            key={et.key}
            onClick={() => {
              setTipoEvento(et.key);
              setError("");
              setSaved(false);
            }}
            className={`event-type-btn${
              tipoEvento === et.key
                ? ` event-type-btn--active-${et.key}`
                : ""
            }`}
          >
            <span className="event-type-btn__icon">{et.icon}</span>
            <span className="event-type-btn__label">{et.label}</span>
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="event-form">
        <div className="event-form__title">
          Registro de{" "}
          {eventTypes.find((e) => e.key === tipoEvento)?.label}
        </div>

        {/* Animal selector */}
        <div className="form-field">
          <label className="form-label">
            ID Animal <span className="form-label__required">*</span>
          </label>
          <div className="form-select-wrapper">
            <select
              className="form-select"
              value={form.animalId}
              onChange={(e) =>
                setForm((f) => ({ ...f, animalId: e.target.value }))
              }
            >
              <option value="">Seleccionar animal...</option>
              {animals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.chapeta} — {a.nombre}
                </option>
              ))}
            </select>
            <span className="form-select-wrapper__arrow">▾</span>
          </div>
        </div>

        {/* Fecha */}
        <div className="form-field">
          <label className="form-label">
            Fecha <span className="form-label__required">*</span>
          </label>
          <div className="form-date-group">
            <input
              className="form-date-input"
              value={form.fecha}
              placeholder="DD/MM/AAAA"
              onChange={(e) =>
                setForm((f) => ({ ...f, fecha: e.target.value }))
              }
            />
            <button className="form-date-btn">📅</button>
          </div>
        </div>

        {/* Pesaje */}
        {tipoEvento === "pesaje" && (
          <div className="form-field">
            <label className="form-label">
              Peso (kg) <span className="form-label__required">*</span>
            </label>
            <input
              type="number"
              placeholder="Ej: 420"
              className={`form-input${error ? " form-input--error" : ""}`}
              value={form.peso}
              onChange={(e) => {
                setForm((f) => ({ ...f, peso: e.target.value }));
                setError("");
              }}
            />
            {error && <div className="form-error">⚠️ {error}</div>}
          </div>
        )}

        {/* Nacimiento */}
        {tipoEvento === "nacimiento" && (
          <>
            <div className="form-field">
              <label className="form-label">
                Sexo de la cría{" "}
                <span className="form-label__required">*</span>
              </label>
              <div className="form-select-wrapper">
                <select
                  className="form-select"
                  value={form.sexoCria}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sexoCria: e.target.value }))
                  }
                >
                  <option value="">Seleccionar...</option>
                  <option value="hembra">Hembra</option>
                  <option value="macho">Macho</option>
                </select>
                <span className="form-select-wrapper__arrow">▾</span>
              </div>
              {error && <div className="form-error">⚠️ {error}</div>}
            </div>
            <div className="form-field">
              <label className="form-label">Observaciones</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Notas adicionales..."
                value={form.observaciones}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    observaciones: e.target.value,
                  }))
                }
              />
            </div>
          </>
        )}

        {/* Tratamiento */}
        {tipoEvento === "tratamiento" && (
          <div className="form-field">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe el tratamiento aplicado..."
              value={form.observaciones}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  observaciones: e.target.value,
                }))
              }
            />
          </div>
        )}

        <button
          onClick={handleSave}
          className={`save-btn${saved ? " save-btn--saved" : ""}`}
        >
          {saved ? "✓ Guardado" : "Guardar"}
        </button>

        <div className="offline-warning">
          <span>⚠️</span>
          <span>
            <strong>Sin conexión.</strong> Los eventos se sincronizarán
            cuando haya conexión.
          </span>
        </div>
      </div>

      <div className="event-panel__footer">
        <button className="register-btn">+ Registrar Evento</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */

export default function FincaDashboard({ animals = [], alertas = [], online = false, pendingCount = 0 }) {
  const [activeNav,      setActiveNav]      = useState("dashboard");
  const [activeFilter,   setActiveFilter]   = useState("Todos");
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [showEventPanel, setShowEventPanel] = useState(false);
  const [search,         setSearch]         = useState("");

  const filteredAnimals = animals.filter((a) => {
    const matchSearch =
      search === "" ||
      a.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      a.chapeta?.includes(search);
    const estadoTarget = FILTER_KEYS[activeFilter];
    const matchFilter  = !estadoTarget || a.estado_actual === estadoTarget;
    return matchSearch && matchFilter;
  });

  return (
    <div className="app">
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

      <div className="main">
        <TopBar online={online} pendingCount={pendingCount} />

        <div className="content">
          {/* Page header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Tablero</h1>
              <div className="page-subtitle">
                <span>✅</span>
                <span className="page-subtitle__text">[NOMBRE FINCA]</span>
              </div>
            </div>
            {!showEventPanel && (
              <button
                className="open-event-btn"
                onClick={() => setShowEventPanel(true)}
              >
                + Nuevo Evento
              </button>
            )}
          </div>

          <div className="panels">
            {/* ── LEFT: animal list ── */}
            <div className="animal-list-panel">
              <div className="search-wrapper">
                <div className="search-box">
                  <span className="search-box__icon">🔍</span>
                  <input
                    className="search-box__input"
                    value={search}
                    placeholder="Buscar por ID o nombre"
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="filters">
                {Object.keys(FILTER_KEYS).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`filter-btn filter-btn--${filterClass[f]}${
                      activeFilter === f ? " filter-btn--active" : ""
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="animal-cards">
                {filteredAnimals.length === 0 ? (
                  <EmptyState
                    icon="🐄"
                    title="Sin animales"
                    subtitle="Carga los datos desde tu backend"
                  />
                ) : (
                  filteredAnimals.map((a) => (
                    <AnimalCard
                      key={a.id}
                      animal={a}
                      selected={selectedAnimal?.id === a.id}
                      onClick={() => setSelectedAnimal(a)}
                    />
                  ))
                )}
              </div>

              {/* Alertas */}
              {alertas.length > 0 && (
                <div className="alertas">
                  <div className="alertas__title">Alertas de Salud</div>
                  <div className="alertas__list">
                    {alertas.map((a, i) => (
                      <div
                        key={i}
                        className="alerta-item"
                        style={{
                          background: `${a.color}12`,
                          border:     `1px solid ${a.color}30`,
                        }}
                      >
                        <div className="alerta-item__left">
                          <div
                            className="alerta-item__dot"
                            style={{ background: a.color }}
                          >
                            ✓
                          </div>
                          <span className="alerta-item__text">
                            {a.mensaje}
                          </span>
                        </div>
                        <span className="alerta-item__arrow">›</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── MIDDLE: animal detail ── */}
            {selectedAnimal ? (
              <AnimalDetail animal={selectedAnimal} />
            ) : (
              <div className="detail-panel detail-panel--placeholder">
                <EmptyState
                  icon="👈"
                  title="Selecciona un animal"
                  subtitle="Haz clic en cualquier animal de la lista para ver su detalle"
                />
              </div>
            )}

            {/* ── RIGHT: new event ── */}
            {showEventPanel && (
              <NuevoEventoPanel
                animals={animals}
                onClose={() => setShowEventPanel(false)}
                onSave={(data) => {
                  console.log("Nuevo evento:", data);
                  // Aquí conectas con tu API Django
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}