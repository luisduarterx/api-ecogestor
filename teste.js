// pg-test.ts
import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:1234@localhost:5432/api-local?schema=public";

const client = new pg.Client({
  connectionString,
  ssl: false, // coloque true se for testar com SSL
});

async function testConnection() {
  try {
    await client.connect();
    console.log("✅ Conectado ao PostgreSQL com sucesso!");

    const res = await client.query("SELECT now() AS data_hora");
    console.log("🕒 Data/hora no banco:", res.rows[0].data_hora);
  } catch (err) {
    console.error("❌ Falha ao conectar:", err);
  } finally {
    await client.end();
  }
}

testConnection();
