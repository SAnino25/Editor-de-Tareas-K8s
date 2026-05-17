const express = require("express");
const cors = require("cors");
const { pool, initDB } = require("./db");

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS Configuration ────────────────────────────────
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));
app.use(express.json());

// ── Request Logger ───────────────────────────────────
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} from ${req.headers.origin || "unknown"}`);
  next();
});

// ── Health check ──────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── GET /tasks — listar todas ─────────────────────────
app.get("/tasks", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM tasks ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /tasks/:id — obtener una ──────────────────────
app.get("/tasks/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM tasks WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /tasks — crear ───────────────────────────────
app.post("/tasks", async (req, res) => {
  const { title, description, priority } = req.body;
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "El título es obligatorio" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, priority)
       VALUES ($1, $2, $3) RETURNING *`,
      [title.trim(), description || "", priority || "medium"]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /tasks/:id — actualizar ───────────────────────
app.put("/tasks/:id", async (req, res) => {
  const { title, description, priority, completed } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE tasks
       SET title = $1, description = $2, priority = $3,
           completed = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [title, description, priority, completed, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /tasks/:id/toggle — cambiar completado ──────
app.patch("/tasks/:id/toggle", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE tasks SET completed = NOT completed, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /tasks/:id — borrar ────────────────────────
app.delete("/tasks/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json({ message: "Tarea eliminada", task: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Arranque ──────────────────────────────────────────
const start = async () => {
  try {
    console.log("🔄 Inicializando base de datos...");
    await initDB();
    console.log("✅ Base de datos inicializada");

    app.listen(PORT, () => {
      console.log(`🚀 Backend escuchando en http://localhost:${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error("❌ Error iniciando el servidor:", err.message);
    console.error(err);
    process.exit(1);
  }
};

start();
