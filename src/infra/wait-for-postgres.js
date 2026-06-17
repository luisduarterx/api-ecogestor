const dotenv = require("dotenv");
dotenv.config({
  path: ".env.development",
});
const { exec } = require("node:child_process");

process.stdout.write("🔴 Aguardando postgres aceitar conexões...");

function checkPostgres() {
  exec("docker exec ecogestor pg_isready --host localhost", handleReturn);

  function handleReturn(error, stdout) {
    if (stdout.search("accepting connections") === -1) {
      process.stdout.write(".");
      checkPostgres();
      return;
    }

    process.stdout.write("🟢 Postgres aceitando conexões");

    exec("prisma migrate deploy", (error, stdout) => {
      if (error) {
        console.error(`Erro ao rodar as migrations: ${error.message}`);
        process.exit(1);
      }
      console.log(stdout);
      process.exit(0);
    });
    exec("prisma generate", (error, stdout) => {
      if (error) {
        console.error(`Erro ao gerar o Prisma Client: ${error.message}`);
        process.exit(1);
      }
      console.log(stdout);
    });
  }
}

checkPostgres();
