# Age Estimation API Documentation

## Table of Contents

- [Age Estimation API Documentation](#age-estimation-api-documentation)
  - [Table of Contents](#table-of-contents)
    - [Introduction](#introduction)
    - [API Endpoints](#api-endpoints)
      - [GET /](#get-)
      - [GET /api/estimations](#get-apiestimations)
      - [GET /api/estimations/:id](#get-apiestimationsid)
      - [POST /api/estimations](#post-apiestimations)

### Introduction

The Age Estimation API is a simple RESTful API built using Express.js. It provides endpoints for retrieving, creating, and deleting age estimations.

### API Endpoints

#### GET /

- **Description**: Returns a welcome message and the status of the API.
- **Parameters**: None
- **Response**: A JSON object with a `message` and a `status` property.
- **Example Response**:

```json
{
  "message": "Age Estimation API",
  "status": "running"
}
```

#### GET /api/estimations

- **Description**: Returns a list of all age estimations.
- **Parameters**: None
- **Response**: A JSON object with a `success` property and a `data` property containing an array of age estimations.
- **Example Response**:

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Alice", "age": 28, "confidence": 0.92 },
    { "id": 2, "name": "Bob", "age": 45, "confidence": 0.78 },
    { "id": 3, "name": "Charlie", "age": 34, "confidence": 0.87 }
  ]
}
```

#### GET /api/estimations/:id

- **Description**: Returns a single age estimation by ID.
- **Parameters**:
  - `id`: The ID of the age estimation to retrieve (integer, required)
- **Response**: A JSON object with a `success` property and a `data` property containing the age estimation, or an error message if not found.
- **Example Response**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Alice",
    "age": 28,
    "confidence": 0.92
  }
}
```

- **Error Response**:

```json
{
  "success": false,
  "error": "Not found"
}
```

#### POST /api/estimations

- **Description**: Creates a new age estimation.
- **Parameters**:
  - `name`: The name of the person to estimate the age for (string, required)
- **Response**: A JSON object with a `success` property and a `data` property containing the newly created age estimation.
- **Example Request**:

```json
{
  "name": "David"
}
```

- **Example Response**:

```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "David",
    "age": 32,
    "confidence": 0.85
  }
}
```

Note: Replace `http://localhost:3000` with the actual URL of your API.
