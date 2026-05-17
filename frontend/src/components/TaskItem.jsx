export default function TaskItem({ task, onEdit, onToggle, onDelete, priorityColors, priorityLabels }) {
  const date = new Date(task.created_at).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div style={{
      ...s.card,
      opacity: task.completed ? 0.7 : 1,
      borderLeft: `4px solid ${priorityColors[task.priority]}`,
    }}>
      <div style={s.top}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#6366f1" }}
        />
        <div style={s.info}>
          <p style={{
            ...s.title,
            textDecoration: task.completed ? "line-through" : "none",
            color: task.completed ? "#9ca3af" : "#111827",
          }}>
            {task.title}
          </p>
          {task.description && (
            <p style={s.desc}>{task.description}</p>
          )}
          <div style={s.meta}>
            <span style={{ ...s.badge, background: `${priorityColors[task.priority]}20`, color: priorityColors[task.priority] }}>
              {priorityLabels[task.priority]}
            </span>
            <span style={s.date}>📅 {date}</span>
            {task.completed && <span style={s.doneBadge}>✓ Completada</span>}
          </div>
        </div>
        <div style={s.btns}>
          <button onClick={() => onEdit(task)} style={s.editBtn} title="Editar">✏️</button>
          <button onClick={() => onDelete(task.id)} style={s.delBtn} title="Eliminar">🗑️</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  card: {
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 12,
    padding: "1rem",
    transition: "box-shadow 0.15s",
  },
  top: { display: "flex", alignItems: "flex-start", gap: "0.75rem" },
  info: { flex: 1, minWidth: 0 },
  title: { fontWeight: 600, fontSize: "0.95rem", marginBottom: 4, wordBreak: "break-word" },
  desc: { fontSize: "0.85rem", color: "#6b7280", marginBottom: 6, wordBreak: "break-word" },
  meta: { display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" },
  badge: {
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 20,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  date: { fontSize: "0.75rem", color: "#9ca3af" },
  doneBadge: {
    fontSize: "0.72rem",
    background: "#f0fdf4",
    color: "#16a34a",
    padding: "2px 8px",
    borderRadius: 20,
    fontWeight: 600,
  },
  btns: { display: "flex", gap: "0.25rem", flexShrink: 0 },
  editBtn: {
    background: "transparent",
    border: "none",
    fontSize: "1rem",
    padding: "4px 6px",
    borderRadius: 6,
    cursor: "pointer",
  },
  delBtn: {
    background: "transparent",
    border: "none",
    fontSize: "1rem",
    padding: "4px 6px",
    borderRadius: 6,
    cursor: "pointer",
  },
};
