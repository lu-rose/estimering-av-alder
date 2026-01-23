import { jest } from "@jest/globals";
import { processUserData } from "./simple-test.js";

// Mock functions for testing
global.getAllUsers = () => [
  { email: "rose@example.com", name: "Rose" },
  { email: "simen@example.com", name: "Simen" },
  { email: "bob@example.com", name: "Bob" },
];

global.database = {
  query: jest.fn(() => ({ result: "mock result" })),
};

describe("function processUserData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return user when email matches", () => {
    const userData = { email: "rose@example.com" };
    const result = processUserData(userData);

    expect(result.email).toBe("rose@example.com");
  });

  test("should handle email that is not in the list", () => {
    const userData = { email: "unknown@example.com" };

    // This should not throw TypeError about undefined
    const result = processUserData(userData);
    expect(result).toBeDefined();
  });
});
