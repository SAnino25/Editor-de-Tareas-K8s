import { useState, useEffect } from "react";
import axios from "axios";
import TaskForm from "./components/TaskForm.jsx";
import TaskList from "./components/TaskList.jsx";

const API = "/api"; // Usar proxy de Vite para conectar al backend

// Logging para debugging
console.log("📡 API Proxy URL siendo usada:", API);

const PRIORITY_COLORS = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };
const PRIORITY_LABELS = { low: "Baja", medium: "Media", high: "Alta" };

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState("all");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`${API}/tasks`);
      setTasks(data);
    } catch {
      setError("No se pudo conectar al servidor. ¿Está levantado el backend?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleCreate = async (taskData) => {
    try {
      console.log("📤 Enviando POST a:", `${API}/tasks`);
      const { data } = await axios.post(`${API}/tasks`, taskData);
      console.log("✅ Tarea creada:", data);
      setTasks((prev) => [data, ...prev]);
    } catch (err) {
      console.error("❌ Error al crear tarea:", err);
      setError("Error al crear la tarea: " + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdate = async (id, taskData) => {
    try {
      console.log("📤 Enviando PUT a:", `${API}/tasks/${id}`);
      const { data } = await axios.put(`${API}/tasks/${id}`, taskData);
      console.log("✅ Tarea actualizada:", data);
      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
      setEditingTask(null);
    } catch (err) {
      console.error("❌ Error al actualizar tarea:", err);
      setError("Error al actualizar la tarea: " + (err.response?.data?.error || err.message));
    }
  };

  const handleToggle = async (id) => {
    try {
      console.log("📤 Enviando PATCH a:", `${API}/tasks/${id}/toggle`);
      const { data } = await axios.patch(`${API}/tasks/${id}/toggle`);
      console.log("✅ Tarea toggled:", data);
      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
    } catch (err) {
      console.error("❌ Error al toggle tarea:", err);
      setError("Error al toggled la tarea: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    try {
      console.log("📤 Enviando DELETE a:", `${API}/tasks/${id}`);
      await axios.delete(`${API}/tasks/${id}`);
      console.log("✅ Tarea eliminada");
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("❌ Error al eliminar tarea:", err);
      setError("Error al eliminar la tarea: " + (err.response?.data?.error || err.message));
    }
  };

  const filtered = tasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.completed).length,
    pending: tasks.filter((t) => !t.completed).length,
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.title}>📋 Task Editor</h1>
          <p style={styles.subtitle}>Gestión de tareas multi-contenedor con Docker</p>
        </div>
        <div style={styles.stats}>
          {[
            { label: "Total", value: stats.total, color: "#6366f1" },
            { label: "Pendientes", value: stats.pending, color: "#f59e0b" },
            { label: "Completadas", value: stats.done, color: "#22c55e" },
          ].map((s) => (
            <div key={s.label} style={{ ...styles.statCard, borderColor: s.color }}>
              <span style={{ ...styles.statNum, color: s.color }}>{s.value}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.formSection}>
          <h2 style={styles.sectionTitle}>
            {editingTask ? "✏️ Editar tarea" : "➕ Nueva tarea"}
          </h2>
          <TaskForm
            key={editingTask?.id ?? "new"}
            initial={editingTask}
            onSubmit={editingTask
              ? (d) => handleUpdate(editingTask.id, d)
              : handleCreate}
            onCancel={editingTask ? () => setEditingTask(null) : null}
            priorityColors={PRIORITY_COLORS}
            priorityLabels={PRIORITY_LABELS}
          />
        </section>

        <section style={styles.listSection}>
          <div style={styles.listHeader}>
            <h2 style={styles.sectionTitle}>Tareas</h2>
            <div style={styles.filters}>
              {["all", "pending", "done"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    ...styles.filterBtn,
                    ...(filter === f ? styles.filterActive : {}),
                  }}
                >
                  {{ all: "Todas", pending: "Pendientes", done: "Completadas" }[f]}
                </button>
              ))}
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {loading ? (
            <div style={styles.loading}>Cargando tareas...</div>
          ) : (
            <TaskList
              tasks={filtered}
              onEdit={setEditingTask}
              onToggle={handleToggle}
              onDelete={handleDelete}
              priorityColors={PRIORITY_COLORS}
              priorityLabels={PRIORITY_LABELS}
            />
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f0f2f5" },
  header: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    padding: "2rem",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  },
  headerInner: {},
  title: { fontSize: "2rem", fontWeight: 700, marginBottom: "0.25rem" },
  subtitle: { opacity: 0.85, fontSize: "0.9rem" },
  stats: { display: "flex", gap: "1rem", flexWrap: "wrap" },
  statCard: {
    background: "rgba(255,255,255,0.15)",
    border: "2px solid",
    borderRadius: 12,
    padding: "0.75rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 80,
    backdropFilter: "blur(4px)",
  },
  statNum: { fontSize: "1.8rem", fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: "0.75rem", opacity: 0.9, marginTop: 4 },
  main: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "2rem 1rem",
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: "1.5rem",
    alignItems: "start",
  },
  formSection: {
    background: "#fff",
    borderRadius: 16,
    padding: "1.5rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    position: "sticky",
    top: "1rem",
  },
  listSection: {
    background: "#fff",
    borderRadius: 16,
    padding: "1.5rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  sectionTitle: { fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#374151" },
  listHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" },
  filters: { display: "flex", gap: "0.5rem" },
  filterBtn: {
    padding: "0.35rem 0.85rem",
    borderRadius: 20,
    border: "1.5px solid #e5e7eb",
    background: "transparent",
    fontSize: "0.8rem",
    color: "#6b7280",
    transition: "all 0.15s",
  },
  filterActive: {
    background: "#6366f1",
    borderColor: "#6366f1",
    color: "#fff",
    fontWeight: 600,
  },
  loading: { textAlign: "center", padding: "2rem", color: "#9ca3af" },
  error: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    borderRadius: 10,
    padding: "1rem",
    marginBottom: "1rem",
    fontSize: "0.9rem",
  },
};
