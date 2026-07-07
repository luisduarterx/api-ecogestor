// import { prisma } from "../src/libs/prisma";
// import cargo from "../src/model/cargos";
// import categoria from "../src/model/categorias";
// import material from "../src/model/materiais";
// import user from "../src/model/users";

// async function seed() {
//     await prisma.permissoes.createManyAndReturn({
//       data: [
//         { nome: "create:cargo" },
//         { nome: "read:cargo" },
//         { nome: "read:cargos" },
//         { nome: "update:cargo" },
//         { nome: "delete:cargo" },
//         { nome: "read:usuario" },
//         { nome: "read:usuarios" },
//         { nome: "create:usuario" },
//         { nome: "delete:usuario" },
//         { nome: "update:usuario" },
//         { nome: "read:categoria_materiais" },
//         { nome: "read:categorias_materiais" },
//         { nome: "create:categoria_materiais" },
//         { nome: "delete:categoria_materiais" },
//         { nome: "update:categoria_materiais" },
//         { nome: "create:material" },
//         { nome: "read:material" },
//         { nome: "update:material" },
//         { nome: "delete:material" },
//         { nome: "read:materiais" },
//         { nome: "read:registro" },
//         { nome: "read:registros" },
//         { nome: "create:registros" },
//         { nome: "update:registros" },
//         { nome: "delete:registros" },
//       ],
//       skipDuplicates: true, // Evita erros se rodar o teste localmente pela segunda vez
//     });
//     const permissoes = await prisma.permissoes.findMany();
//     const mapPermissions = permissoes.map((item) => ({ id: item.id }));

//     const cargoAdmin = await prisma.cargo.create({
//       data: {
//         nome: "ADMIN",
//         permissoes: {
//           connect: mapPermissions,
//         },
//       },
//       include: {
//         permissoes: true,
//       },
//     });
//     await user.create({
//       nome: "LUIS",
//       email: "luiscdradm@gmail.com",
//       cargoID: cargoAdmin.id,
//     });

//   const cat1 = await categoria.create({ nome: "plasticos" });
//   const cat2 = await categoria.create({ nome: "Ferrosos" });
//   const cat3 = await categoria.create({ nome: "Aluminios" });

//   await material.create({
//     nome: "Cobre mel",
//     catID: cat2.id,
//     preco_compra: 13.5,
//     preco_venda: 19.4,
//   });
//   await material.create({
//     nome: "Perfil Limpo",
//     catID: cat3.id,
//     preco_compra: 10,
//     preco_venda: 17.0,
//   });
//   await material.create({
//     nome: "PEAD COLORIDO",
//     catID: cat1.id,
//     preco_compra: 0.7,
//     preco_venda: 2.7,
//   });
//   await material.create({
//     nome: "Cobre misto",
//     catID: cat2.id,
//     preco_compra: 47,
//     preco_venda: 63,
//   });
// }

// seed()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.log(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });
