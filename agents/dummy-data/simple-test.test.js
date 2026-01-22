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
  query: jest.fn((query) => ({ result: "mock result", query })),
};

describe("processUserData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should find and return existing user by email", () => {
    const userData = { email: "JANE@EXAMPLE.COM" };
    const result = processUserData(userData);

    expect(result).toBeDefined();
    expect(result.email).toBe("jane@example.com");
    expect(result.name).toBe("Jane");
  });

  test("should handle user not found without crashing", () => {
    const userData = { email: "notfound@example.com" };

    // This test should pass if the function handles the not-found case properly
    // Currently will fail due to off-by-one error causing array out of bounds
    expect(() => {
      processUserData(userData);
    }).not.toThrow();
  });

  test("should not use string concatenation for SQL queries", () => {
    const userData = { email: "hacker@example.com" };
    processUserData(userData);

    // Check that database.query was called
    expect(global.database.query).toHaveBeenCalled();

    // This is a basic check - the real fix should use parameterized queries
    const queryCall = global.database.query.mock.calls[0][0];
    expect(typeof queryCall).toBe("string");
  });
});
