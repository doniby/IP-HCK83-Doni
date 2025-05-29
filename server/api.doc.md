# API Documentation

This document describes the available API endpoints, their request/response structure, and possible errors for the backend server.

---

## Authentication

### POST `/user/register`
- **Request Body:** `{ username, email, password }`
- **Success Response:**
  - `201 Created`
  - `{ message, user: { id, username, email } }`
- **Possible Errors:**
  - `400 Bad Request` — Missing or invalid fields, email/username already in use

### POST `/user/login`
- **Request Body:** `{ email, password }`
- **Success Response:**
  - `200 OK`
  - `{ message, user: { email, access_token } }`
- **Possible Errors:**
  - `400 Bad Request` — Invalid email or password

### POST `/user/google-login`
- **Request Body:** `{ credential }` (Google JWT)
- **Success Response:**
  - `200 OK`
  - `{ user: { email, access_token, ... } }`
- **Possible Errors:**
  - `400 Bad Request` — Invalid Google credential

---

## Entries

### GET `/entries`
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:**
  - `200 OK`
  - `[{ id, content, type, Translation, Categories, ... }, ...]`
- **Possible Errors:**
  - `401 Unauthorized` — Missing/invalid token

### POST `/entries`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `{ content, type, categoryIds?, categoryNames? }`
- **Success Response:**
  - `201 Created`
  - `{ entry, translation }`
- **Possible Errors:**
  - `401 Unauthorized` — Missing/invalid token
  - `403 Forbidden` — Entry limit reached (free users)
  - `400 Bad Request` — Missing/invalid fields

### PUT `/entries/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `{ content?, type?, categoryIds?, categoryNames? }`
- **Success Response:**
  - `200 OK`
  - `{ message, entry }`
- **Possible Errors:**
  - `401 Unauthorized` — Missing/invalid token
  - `404 Not Found` — Entry not found

### DELETE `/entries/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:**
  - `200 OK`
  - `{ message }`
- **Possible Errors:**
  - `401 Unauthorized` — Missing/invalid token
  - `404 Not Found` — Entry not found

---

## Categories

### GET `/categories`
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:**
  - `200 OK`
  - `[{ id, name, UserId, ... }, ...]`
- **Possible Errors:**
  - `401 Unauthorized` — Missing/invalid token

### POST `/categories`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `{ name }`
- **Success Response:**
  - `201 Created`
  - `{ id, name, UserId, ... }`
- **Possible Errors:**
  - `401 Unauthorized` — Missing/invalid token
  - `400 Bad Request` — Missing/invalid name

### PUT `/categories/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `{ name }`
- **Success Response:**
  - `200 OK`
  - `{ id, name, UserId, ... }`
- **Possible Errors:**
  - `401 Unauthorized` — Missing/invalid token
  - `404 Not Found` — Category not found

### DELETE `/categories/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:**
  - `200 OK`
  - `{ message }`
- **Possible Errors:**
  - `401 Unauthorized` — Missing/invalid token
  - `404 Not Found` — Category not found
  - `400 Bad Request` — Cannot delete 'general' category

---

## Transactions (Premium Upgrade)

### GET `/transactions`
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:**
  - `200 OK`
  - `[{ id, status, createdAt, ... }, ...]`
- **Possible Errors:**
  - `401 Unauthorized` — Missing/invalid token

### POST `/transactions`
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:**
  - `201 Created`
  - `{ redirect_url }` (Midtrans payment URL)
- **Possible Errors:**
  - `401 Unauthorized` — Missing/invalid token
  - `400 Bad Request` — Transaction creation failed

### POST `/transactions/notification`
- **Request Body:** (Midtrans webhook payload)
- **Success Response:**
  - `200 OK`
  - `{ message }`
- **Possible Errors:**
  - `400 Bad Request` — Invalid notification

---

## User Profile (if implemented)

### PUT `/user/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `{ email?, username?, password? }`
- **Success Response:**
  - `200 OK`
  - `{ user }`
- **Possible Errors:**
  - `401 Unauthorized` — Missing/invalid token
  - `400 Bad Request` — Invalid fields

---

## General Error Responses
- `401 Unauthorized` — Missing or invalid access token
- `403 Forbidden` — Not enough permissions or entry limit reached
- `404 Not Found` — Resource not found
- `400 Bad Request` — Invalid or missing fields
- `500 Internal Server Error` — Unexpected server error

---

For more details, refer to the backend source code and controller logic.
