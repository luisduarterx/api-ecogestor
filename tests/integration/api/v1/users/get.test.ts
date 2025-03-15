import { generateToken } from "@/models/session";

test("test GET to /api/v1/user", async () => {
  const token = generateToken(1);
  const response = await fetch("http://localhost:3000/api/v1/user", {
    headers: {
      Authorization: `Bearer ${token}`, // 🔐 Envia o token
      "Content-Type": "application/json",
    },
  });
  expect(response.status).toBe(200);
});
