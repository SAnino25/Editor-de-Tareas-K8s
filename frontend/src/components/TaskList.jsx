import TaskItem from "./TaskItem.jsx";

export default function TaskList({ tasks, onEdit, onToggle, onDelete, priorityColors, priorityLabels }) {
  if (!tasks.length) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#9ca3af" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
        <p>No hay tareas aquí</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
          priorityColors={priorityColors}
          priorityLabels={priorityLabels}
        />
      ))}
    </div>
  );
}
