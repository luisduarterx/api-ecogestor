test("test GET to /api/v1/user", async () => {
  const response = await fetch("http://localhost:3000/api/v1/user", {
    method: "POST",
    body: JSON.stringify({}),
  });
  expect(response.status).toBe(200);
});
