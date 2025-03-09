test("test POST to /api/v1/authenticate with email fail", async () => {
  const response = await fetch("http://localhost:3000/api/v1/authenticate", {
    method: "POST",
    body: JSON.stringify({
      email: "",
      senha: "1233",
    }),
  });
  expect(response.status).toBe(400);
});
test("test POST to /api/v1/authenticate empty", async () => {
  const response = await fetch("http://localhost:3000/api/v1/authenticate", {
    method: "POST",
    body: JSON.stringify({}),
  });
  expect(response.status).toBe(400);
});
test("test POST to /api/v1/authenticate incorrect data", async () => {
  const response = await fetch("http://localhost:3000/api/v1/authenticate", {
    method: "POST",
    body: JSON.stringify({
      email: "23423423@sdfsdfs.com",
      senha: "1233",
    }),
  });
  expect(response.status).toBe(403);
});
test("test POST to /api/v1/authenticate  valid data", async () => {
  const response = await fetch("http://localhost:3000/api/v1/authenticate", {
    method: "POST",
    body: JSON.stringify({
      email: "octaquare@gmail.com",
      senha: "1233",
    }),
  });
  expect(response.status).toBe(200);
});
