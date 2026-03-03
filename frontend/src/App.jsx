import { useState, useEffect } from "react";
import Dashboard from "./dashboard";

const API_BASE = "http://localhost:8000"; 

function App() {
  const [animals,      setAnimals]      = useState([]);
  const [alertas,      setAlertas]      = useState([]);
  const [online,       setOnline]       = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading,      setLoading]      = useState(true);

  // Detectar conexión 
  useEffect(() => {
    const goOnline  = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Cargar datos 
  // TODO: Agregar estos endpoints en Django cuando estén listos:
  //   GET /api/animals/         → lista de Animal
  //   GET /api/alertas/         → alertas de salud
  //   POST /api/reproducciones/ → registrar evento
  useEffect(() => {
    setLoading(true);

    setAnimals([]);
    setAlertas([]);
    setLoading(false);
  }, []);

  // ── Consultar último toro de un animal ─────────────────
  // Este es el único endpoint disponible por ahora:
  // GET /api/ultimo-toro/<animal_id>/
  const fetchUltimoToro = async (animalId) => {
    try {
      const res  = await fetch(`${API_BASE}/api/ultimo-toro/${animalId}/`);
      const data = await res.json();
      return data.toro ?? null;
    } catch (err) {
      console.error("Error obteniendo último toro:", err);
      return null;
    }
  };

  // ── Guardar evento (cuando tengas el endpoint) ─────────
  const handleSaveEvento = async (eventoData) => {
    try {
      const res = await fetch(`${API_BASE}/api/reproducciones/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(eventoData),
      });
      if (res.ok) {
        setPendingCount((n) => Math.max(n - 1, 0));
      }
    } catch {
      setPendingCount((n) => n + 1); 
    }

    console.log("Evento a guardar (endpoint pendiente):", eventoData);
    setPendingCount((n) => n + 1);
  };

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"sans-serif", color:"#6b7280" }}>
        Cargando...
      </div>
    );
  }

  return (
    <Dashboard
      animals={animals}
      alertas={alertas}
      online={online}
      pendingCount={pendingCount}
      onSaveEvento={handleSaveEvento}
      onFetchUltimoToro={fetchUltimoToro} 
    />
  );
}

export default App;