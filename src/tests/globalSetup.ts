import { prisma } from "../libs/prisma";

export async function setup() {
  // Esse código roda APENAS UMA VEZ antes de todos os testes começarem
  await prisma.cargo.upsert({
    where: { nome: "ADMIN" },
    update: {},
    create: { id: 1, nome: "ADMIN" },
  });

  console.log("✅ Seed global executado com sucesso!");
}
