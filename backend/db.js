const { Pool } = require("pg");

console.log("📝 Configurando Pool de PostgreSQL con:");
console.log(`   Host: ${process.env.DB_HOST || "localhost"}`);
console.log(`   Puerto: ${process.env.DB_PORT || "5432"}`);
console.log(`   Usuario: ${process.env.DB_USER || "taskuser"}`);
console.log(`   Base de datos: ${process.env.DB_NAME || "tasksdb"}`);

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "taskuser",
  password: process.env.DB_PASSWORD || "taskpass",
  database: process.env.DB_NAME || "tasksdb",
  connectionTimeoutMillis: 10000,
});

// Manejar errores del pool
pool.on("error", (err) => {
  console.error("❌ Error inesperado en el pool de conexiones:", err);
});

const initDB = async () => {
  let retries = 50;
  let delay = 1000;

  console.log(`🔄 Intentando conectar a la base de datos (máx ${retries} intentos, espera de ${delay}ms entre intentos)...`);

  while (retries > 0) {
    try {
      console.log(`   Intento ${51 - retries}/${50}...`);
      const client = await pool.connect();
      console.log("✅ Conexión exitosa a PostgreSQL");
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id        SERIAL PRIMARY KEY,
          title     VARCHAR(255) NOT NULL,
          description TEXT,
          priority  VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
          completed BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      
      client.release();
      console.log("✅ Base de datos inicializada correctamente");
      return;
    } catch (err) {
      retries--;
      if (retries > 0) {
        console.log(`⏳ Error de conexión: ${err.message} - Reintentar en ${delay}ms... (${retries} intentos restantes)`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("❌ No se pudo conectar a la base de datos después de 50 intentos");
        throw new Error(`Fallo al conectarse a la BD después de 50 intentos: ${err.message}`);
      }
    }
  }
};

module.exports = { pool, initDB };
