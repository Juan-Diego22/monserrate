import { useState } from "react";
import "./RegistrarAnimal.css";

/* Opciones exactas del modelo Animal */

const SEXO_CHOICES = [
  { value: "HEMBRA", label: "Hembra" },
  { value: "MACHO", label: "Macho" },
];

const ESTADO_CHOICES = [
  { value: "TERNERA", label: "Ternera" },
  { value: "NOVILLA", label: "Novilla" },
  { value: "VACA_PRODUCCION", label: "Vaca en producción" },
  { value: "SECA", label: "Vaca seca" },
  { value: "DESCARTADA", label: "Descartada" },
];

const INITIAL_FORM = {
  chapeta:          "",   
  fecha_nacimiento: "",   
  sexo:             "",   
  madre:            "",   
  padre_nombre:     "",   
  estado_actual:    "",   
  activa:           true, 
};

/* Componente Field */
function Field({ label, required, error, children }) {
  return (
    <div className="mf__field">
      <label className="mf__label">
        {label}
        {required && <span className="mf__required"> *</span>}
      </label>
      {children}
      {error && <span className="mf__error">⚠ {error}</span>}
    </div>
  );
}

/* Modal principal */
export default function RegistrarAnimal({ animales = [], onClose, onGuardar }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const set = (key, value) => {
    setForm(f  => ({ ...f,  [key]: value }));
    setErrors(e => ({ ...e, [key]: "" }));
  };

  /* Validación igual a los constraints del modelo */
  const validate = () => {
    const e = {};
    if (!form.chapeta.trim()) e.chapeta = "La chapeta es obligatoria.";
    if (!form.fecha_nacimiento)    e.fecha_nacimiento = "La fecha de nacimiento es obligatoria.";
    if (!form.sexo) e.sexo = "El sexo es obligatorio.";
    if (!form.padre_nombre.trim()) e.padre_nombre = "El nombre del padre / toro es obligatorio.";
    if (!form.estado_actual) e.estado_actual = "El estado es obligatorio.";
    return e;
  };

  const handleGuardar = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    onGuardar?.({
      ...form,
      madre: form.madre || null,   // null si no se seleccionó
    });

    setSaved(true);
    setTimeout(() => { setSaved(false); onClose?.(); }, 1400);
  };

  /* Solo hembras pueden ser madre */
  const madresDisponibles = animales.filter(a => a.sexo === "HEMBRA");

  return (
    <div className="mf__overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="mf__modal">

        {/* Header */}
        <div className="mf__header">
          <div className="mf__header-left">
            <div className="mf__header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div>
              <div className="mf__title">Registrar Animal</div>
              <div className="mf__subtitle">Completa los datos del nuevo animal</div>
            </div>
          </div>
          <button className="mf__close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="mf__body">

          {/* chapeta + sexo */}
          <div className="mf__row">
            <Field label="Chapeta" required error={errors.chapeta}>
              <input
                className={`mf__input${errors.chapeta ? " mf__input--err" : ""}`}
                placeholder="Ej: 001"
                value={form.chapeta}
                onChange={e => set("chapeta", e.target.value)}
              />
            </Field>

            <Field label="Sexo" required error={errors.sexo}>
              <div className="mf__sel-wrap">
                <select
                  className={`mf__select${errors.sexo ? " mf__input--err" : ""}`}
                  value={form.sexo}
                  onChange={e => set("sexo", e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {SEXO_CHOICES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <span className="mf__arrow">▾</span>
              </div>
            </Field>
          </div>

          {/* fecha_nacimiento + estado_actual */}
          <div className="mf__row">
            <Field label="Fecha de nacimiento" required error={errors.fecha_nacimiento}>
              <input
                type="date"
                className={`mf__input${errors.fecha_nacimiento ? " mf__input--err" : ""}`}
                value={form.fecha_nacimiento}
                onChange={e => set("fecha_nacimiento", e.target.value)}
              />
            </Field>

            <Field label="Estado actual" required error={errors.estado_actual}>
              <div className="mf__sel-wrap">
                <select
                  className={`mf__select${errors.estado_actual ? " mf__input--err" : ""}`}
                  value={form.estado_actual}
                  onChange={e => set("estado_actual", e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {ESTADO_CHOICES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <span className="mf__arrow">▾</span>
              </div>
            </Field>
          </div>

          {/* padre_nombre */}
          <Field label="Nombre del padre / toro" required error={errors.padre_nombre}>
            <input
              className={`mf__input${errors.padre_nombre ? " mf__input--err" : ""}`}
              placeholder="Nombre del toro (finca o inseminación)"
              value={form.padre_nombre}
              onChange={e => set("padre_nombre", e.target.value)}
            />
          </Field>

          {/* madre → ForeignKey self, solo hembras registradas */}
          <Field label="Madre" error={errors.madre}>
            <div className="mf__sel-wrap">
              <select
                className="mf__select"
                value={form.madre}
                onChange={e => set("madre", e.target.value)}
              >
                <option value="">Sin registro / Desconocida</option>
                {madresDisponibles.map(a => (
                  <option key={a.id} value={a.id}>
                    Chapeta {a.chapeta}
                  </option>
                ))}
              </select>
              <span className="mf__arrow">▾</span>
            </div>
          </Field>

          {/* activa → BooleanField */}
          <Field label="¿Animal activo en el sistema?">
            <div className="mf__toggle-group">
              <button
                type="button"
                className={`mf__toggle${form.activa ? " mf__toggle--on" : ""}`}
                onClick={() => set("activa", true)}
              >
                ✓ Activa
              </button>
              <button
                type="button"
                className={`mf__toggle${!form.activa ? " mf__toggle--off" : ""}`}
                onClick={() => set("activa", false)}
              >
                Inactiva
              </button>
            </div>
          </Field>

        </div>

        {/* Footer */}
        <div className="mf__footer">
          <button className="mf__btn mf__btn--cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className={`mf__btn mf__btn--save${saved ? " mf__btn--saved" : ""}`}
            onClick={handleGuardar}
          >
            {saved ? "✓ Guardado" : "Registrar Animal"}
          </button>
        </div>

      </div>
    </div>
  );
}