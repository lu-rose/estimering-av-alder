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

  test("should find existing user by email", () => {
    const userData = { email: "jane@example.com" };
    const result = processUserData(userData);

    expect(result).toBeDefined();
    expect(result.email).toBe("jane@example.com");
    expect(result.name).toBe("Jane");
  });

  test("should not crash when user is not found", () => {
    const userData = { email: "notfound@example.com" };

    // Should not throw an error when searching for non-existent user
    expect(() => {
      processUserData(userData);
    }).not.toThrow();
  });
});
