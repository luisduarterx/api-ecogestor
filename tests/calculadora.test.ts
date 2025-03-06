const calculadora = require("../src/models/calculadora");

test("calculadora", () => {
  expect(calculadora.somar(1, 1)).toBe(2);
});
