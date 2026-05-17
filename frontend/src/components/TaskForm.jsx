import { useState } from "react";

export default function TaskForm({ initial, onSubmit, onCancel, priorityColors, priorityLabels }) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    priority: initial?.priority ?? "medium",
    completed: initial?.completed ?? false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setErr("El título es obligatorio"); return; }
    setErr("");
    setSubmitting(true);
    try {
      await onSubmit(form);
      if (!initial) setForm({ title: "", description: "", priority: "medium", completed: false });
    } catch {
      setErr("Error al guardar la tarea");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      {err && <div style={s.err}>{err}</div>}

      <label style={s.label}>Título *</label>
      <input
        style={s.input}
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder="¿Qué hay que hacer?"
        maxLength={255}
      />

      <label style={s.label}>Descripción</label>
      <textarea
        style={{ ...s.input, height: 72, resize: "vertical" }}
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Detalles opcionales..."
      />

      <label style={s.label}>Prioridad</label>
      <div style={s.prioRow}>
        {["low", "medium", "high"].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => set("priority", p)}
            style={{
              ...s.prioBtn,
              borderColor: priorityColors[p],
              background: form.priority === p ? priorityColors[p] : "transparent",
              color: form.priority === p ? "#fff" : priorityColors[p],
            }}
          >
            {priorityLabels[p]}
          </button>
        ))}
      </div>

      {initial && (
        <label style={{ ...s.label, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={form.completed}
            onChange={(e) => set("completed", e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          Marcar como completada
        </label>
      )}

      <div style={s.actions}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={s.cancelBtn}>Cancelar</button>
        )}
        <button type="submit" disabled={submitting} style={s.submitBtn}>
          {submitting ? "Guardando..." : initial ? "Actualizar" : "Crear tarea"}
        </button>
      </div>
    </form>
  );
}

const s = {
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  label: { fontSize: "0.85rem", fontWeight: 600, color: "#374151" },
  input: {
    width: "100%",
    padding: "0.6rem 0.85rem",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    fontSize: "0.9rem",
    outline: "none",
    transition: "border-color 0.15s",
  },
  prioRow: { display: "flex", gap: "0.5rem" },
  prioBtn: {
    flex: 1,
    padding: "0.4rem 0",
    border: "1.5px solid",
    borderRadius: 8,
    fontSize: "0.8rem",
    fontWeight: 600,
    transition: "all 0.15s",
  },
  actions: { display: "flex", gap: "0.5rem", marginTop: "0.5rem" },
  submitBtn: {
    flex: 1,
    padding: "0.65rem",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  cancelBtn: {
    padding: "0.65rem 1rem",
    background: "transparent",
    color: "#6b7280",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    fontSize: "0.9rem",
  },
  err: {
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: 8,
    padding: "0.5rem 0.75rem",
    fontSize: "0.85rem",
    border: "1px solid #fecaca",
  },
};
