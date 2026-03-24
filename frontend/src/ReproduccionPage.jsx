import { useState, useEffect } from "react";
import "./ReproduccionPage.css"; // Estilos específicos del módulo

const API_BASE = "/api";

const TIPO_OPTIONS = [
  { value: "inseminacion", label: "Inseminación" },
  { value: "monta", label: "Monta natural" },
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "parto", label: "Parto" },
  { value: "secado", label: "Secado" },
];

const ESTADO_OPTIONS = [
  { value: "PRENADA", label: "Preñada" },
  { value: "VACIA", label: "Vací­a" },
];

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getReproductionByAnimal(reproducciones, animalId) {
  const eventos = reproducciones
    .filter((r) => r.animal === animalId)
    .sort((a, b) => new Date(b.fecha_evento) - new Date(a.fecha_evento));

  if (!eventos.length) return null;
  return eventos[0];
}

function inferEstadoPrenado(reproducciones, animalId) {
  const eventos = reproducciones
    .filter((r) => r.animal === animalId)
    .sort((a, b) => new Date(b.fecha_evento) - new Date(a.fecha_evento));

  if (!eventos.length) return false;

  const ultimo = eventos[0];
  if (ultimo.tipo === "parto") return false;
  if (ultimo.tipo === "diagnostico") return ultimo.estado === "PRENADA";

  const diag = eventos.find((e) => e.tipo === "diagnostico");
  return diag?.estado === "PRENADA";
}

export default function ReproduccionPage() {
  const [reproducciones, setReproducciones] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    animal: "",
    fecha_evento: new Date().toISOString().slice(0, 10),
    tipo: "inseminacion",
    sexo_cria: "",
    toro: "",
    estado: "PRENADA",
    observaciones: "",
  });

  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [resp1, resp2] = await Promise.all([
          fetch(`${API_BASE}/reproductions/`),
          fetch(`${API_BASE}/animals/`),
        ]);

        if (!resp1.ok || !resp2.ok) {
          throw new Error("Error cargando datos de reproducción/animales");
        }

        const reproduccionData = await resp1.json();
        const animalsData = await resp2.json();

        setReproducciones(Array.isArray(reproduccionData) ? reproduccionData : reproduccionData.results || []);
        setAnimales(Array.isArray(animalsData) ? animalsData : animalsData.results || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const refreshReproducciones = async () => {
    const resp = await fetch(`${API_BASE}/reproductions/`);
    if (resp.ok) {
      const data = await resp.json();
      setReproducciones(Array.isArray(data) ? data : data.results || []);
    }
  };

  const refreshAnimals = async () => {
    const resp = await fetch(`${API_BASE}/animals/`);
    if (resp.ok) {
      const data = await resp.json();
      setAnimales(Array.isArray(data) ? data : data.results || []);
    }
  };

  const validateForm = () => {
    if (!form.animal) return "Selecciona un animal";
    if (!form.fecha_evento) return "Fecha de evento requerida";

    // Encontrar el animal seleccionado para validaciones adicionales
    const animalSeleccionado = animales.find(a => a.id === form.animal);
    if (!animalSeleccionado) return "Animal no encontrado";

    if (form.tipo === "inseminacion" || form.tipo === "monta") {
      if (!form.toro) return "Debe indicar el nombre del toro para inseminación/monta";
    }

    if (form.tipo === "diagnostico") {
      if (!form.estado) return "Debe indicar el estado del diagnóstico";
    }

    if (form.tipo === "parto") {
      if (!form.sexo_cria) return "Debe indicar el sexo de la cría en parto";
      if (form.toro) return "No debe indicar toro en un parto";
      if (form.estado) return "No debe indicar estado en un parto";
      
      // Validación adicional: solo NOVILLA o SECA pueden parir
      const estadosValidosParaParto = ['NOVILLA', 'SECA'];
      if (!estadosValidosParaParto.includes(animalSeleccionado.estado_actual)) {
        return `No se puede registrar parto en estado ${animalSeleccionado.estado_actual}. Solo NOVILLA o SECA pueden parir.`;
      }
    }

    return null;
  };

  const onFormSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) {
      setMensaje({ type: "error", text: errorMsg });
      return;
    }

    setSaving(true);
    setError(null);

    const payload = { ...form };

    if (form.tipo === "parto") {
      payload.toro = "";
      payload.estado = "";
    }

    if (form.tipo === "secado") {
      payload.sexo_cria = "";
    }

    try {
      const res = await fetch(`${API_BASE}/reproductions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const details = await res.json().catch(() => null);
        const errText = details ? JSON.stringify(details) : `${res.statusText}`;
        throw new Error(`Error guardando reproducción: ${errText}`);
      }

      setMensaje({ type: "success", text: "Reproducción guardada correctamente" });
      setForm({
        animal: "",
        fecha_evento: new Date().toISOString().slice(0, 10),
        tipo: "inseminacion",
        sexo_cria: "",
        toro: "",
        estado: "PRENADA",
        observaciones: "",
      });
      await Promise.all([refreshReproducciones(), refreshAnimals()]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onTipoChange = (tipo) => {
    const next = { ...form, tipo };

    if (tipo === "parto") {
      next.toro = "";
      next.estado = "";
    }

    if (tipo === "secado") {
      next.toro = "";
      next.estado = "";
      next.sexo_cria = "";
    }

    if (tipo === "diagnostico") {
      next.sexo_cria = "";
    }

    if (tipo === "inseminacion" || tipo === "monta") {
      next.estado = "";
    }

    setForm(next);
  };

  const getLastToro = async () => {
    if (!form.animal || !["inseminacion", "monta"].includes(form.tipo)) {
      setMensaje({ type: "error", text: "Selecciona animal y tipo inseminación/monta para buscar el toro" });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/ultimo-toro/${form.animal}/`);
      if (!res.ok) throw new Error("No se pudo leer último toro");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setForm((prev) => ({ ...prev, toro: data.toro || "" }));
      setMensaje({ type: "success", text: data.toro ? `Toro último: ${data.toro}` : "No hay toro anterior" });
    } catch (err) {
      setMensaje({ type: "error", text: err.message });
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  if (loading) return <div className="empty-state">Cargando módulo de reproducción...</div>;
  if (error) return <div className="empty-state">Error: {error}</div>;

  const tabla = reproducciones
    .slice()
    .sort((a, b) => new Date(b.fecha_evento) - new Date(a.fecha_evento));

  return (
    <div className="reproduccion-page">
      <h2 style={{ marginBottom: 12 }}>Reproducción</h2>

      {mensaje && (
        <div className={`ap-alert ${mensaje.type === "error" ? "ap-alert--error" : "ap-alert--success"}`}>
          {mensaje.text}
        </div>
      )}

      <form className="ap-form" onSubmit={onFormSubmit}>
        <div className="ap-form-row">
          <label>Animal</label>
          <select
            value={form.animal}
            onChange={(e) => setForm({ ...form, animal: Number(e.target.value) || "" })}
            required
          >
            <option value="">Seleccione...</option>
            {animales.map((a) => (
              <option key={a.id} value={a.id}>
                {a.chapeta} – {a.estado_actual}
              </option>
            ))}
          </select>
        </div>

        <div className="ap-form-row">
          <label>Fecha del evento</label>
          <input
            type="date"
            max={today}
            value={form.fecha_evento}
            onChange={(e) => setForm({ ...form, fecha_evento: e.target.value })}
            required
          />
        </div>

        <div className="ap-form-row">
          <label>Tipo</label>
          <select value={form.tipo} onChange={(e) => onTipoChange(e.target.value)}>
            {TIPO_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {["inseminacion", "monta"].includes(form.tipo) && (
          <div className="ap-form-row">
            <label>Toro</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={form.toro}
                onChange={(e) => setForm({ ...form, toro: e.target.value })}
                required
              />
              <button type="button" onClick={getLastToro}>Último toro</button>
            </div>
          </div>
        )}

        {form.tipo === "diagnostico" && (
          <div className="ap-form-row">
            <label>Estado diagnóstico</label>
            <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} required>
              <option value="">Seleccione...</option>
              {ESTADO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {form.tipo === "parto" && (
          <div className="ap-form-row">
            <label>Sexo cría</label>
            <select value={form.sexo_cria} onChange={(e) => setForm({ ...form, sexo_cria: e.target.value })} required>
              <option value="">Seleccione...</option>
              <option value="hembra">Hembra</option>
              <option value="macho">Macho</option>
            </select>
          </div>
        )}

        <div className="ap-form-row ap-form-row--full">
          <label>Observaciones</label>
          <textarea
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            rows={2}
          />
        </div>

        <button className="btn-registrar" type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar evento de reproducción"}
        </button>
      </form>

      <div style={{ marginTop: 24 }}>
        <h3>Historial</h3>
        {tabla.length === 0 ? (
          <div className="empty-state">No hay eventos de reproducción aún.</div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Chapeta</th>
                  <th>Tipo</th>
                  <th>Toro</th>
                  <th>Estado</th>
                  <th>Sexo cría</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((evento) => {
                  const animal = animales.find((a) => a.id === evento.animal);
                  return (
                    <tr key={evento.id}>
                      <td>{formatFecha(evento.fecha_evento)}</td>
                      <td>{animal ? animal.chapeta : "-"}</td>
                      <td>{TIPO_OPTIONS.find((t) => t.value === evento.tipo)?.label || evento.tipo}</td>
                      <td>{evento.toro || "-"}</td>
                      <td>{evento.estado || "-"}</td>
                      <td>{evento.sexo_cria || "-"}</td>
                      <td>{evento.observaciones || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
