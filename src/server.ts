import "dotenv/config"; // <- ISSO DEVE SER A PRIMEIRA LINHA DO SEU PROJETO

import { app } from "./app";

app.listen(4000, () => {
  console.log("EcoGestor API rodando...");
});
//app.use(popular);
