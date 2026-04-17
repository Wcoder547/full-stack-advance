import { suite, test } from "node:test";
import { greet } from "../app.js";
import assert from "node:assert";

suite("greet function tests", () => {
  test("greet returns a greeting", () => {
    // Arrange
    // Act
    // Assert

    const expected = "Hello, World!";
    const actual = greet("World");

    assert.strictEqual(actual, expected);
  });

  test("greet returns a greeting with different word", () => {
    // Arrange
    // Act
    // Assert

    const expected = "Hello, Node!";
    const actual = greet("Node");

    assert.strictEqual(actual, expected);
  });
});

test("greet returns a greeting", () => {
  // Arrange
  // Act
  // Assert

  const expected = "Hello, World!";
  const actual = greet("World");

  assert.strictEqual(actual, expected);
});
