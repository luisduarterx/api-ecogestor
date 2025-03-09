test("test POST to /api/v1/user with email fail", async () => {
  const response = await fetch("http://localhost:3000/api/v1/user", {
    method: "POST",
    body: JSON.stringify({
      nome: "Kaylany Santos",
      email: "",
      senha: "1233",
      telefone: "21993808040",
    }),
  });
  expect(response.status).toBe(400);
});

test("test POST to /api/v1/user empty", async () => {
  const response = await fetch("http://localhost:3000/api/v1/user", {
    method: "POST",
    body: JSON.stringify({}),
  });
  expect(response.status).toBe(400);
});
