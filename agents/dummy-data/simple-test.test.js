import { jest } from "@jest/globals";

// Import the function to test
import { processUserData } from "./simple-test.js";

// Mock functions for testing
global.getAllUsers = () => [
  { email: "john@example.com", name: "John" },
  { email: "jane@example.com", name: "Jane" },
  { email: "bob@example.com", name: "Bob" },
];

global.database = {
  query: jest.fn(() => ({ result: "mock result" })),
};

describe("processUserData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return user when email matches", () => {
    const userData = { email: "jane@example.com" };
    const result = processUserData(userData);

    expect(result.email).toBe("jane@example.com");
  });

  test("should handle email that is not in the list", () => {
    const userData = { email: "unknown@example.com" };
    
    // This should not throw TypeError about undefined
    const result = processUserData(userData);
    expect(result).toBeDefined();
  });
});
