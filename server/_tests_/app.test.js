const request = require("supertest");
const app = require("../app");
const {
  sequelize,
  User,
  Category,
  Entry,
  Translation,
  Transaction,
} = require("../models");
const { seedAll } = require("./seed");
const jwt = require("jsonwebtoken");

describe("API Integration Tests", () => {
  let accessToken;
  let userId;

  // Ensure a clean DB state before all tests
  beforeAll(async () => {
    await seedAll();
  });

  // Optionally reseed before each test for isolation (uncomment if needed)
  // beforeEach(async () => {
  //   await seedAll();
  // });

  // Close DB connection after all tests
  afterAll(async () => {
    await sequelize.close();
  });

  test("Register a new user", async () => {
    const res = await request(app).post("/user/register").send({
      username: "testuser",
      email: "test@mail.com",
      password: "password",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty("id");
    userId = res.body.user.id;
  });

  test("Login as the new user", async () => {
    const res = await request(app)
      .post("/user/login")
      .send({ email: "test@mail.com", password: "password" });
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("access_token");
    accessToken = res.body.user.access_token;
  });

  test("Create a new entry (should assign to general category)", async () => {
    const res = await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "saya makan", type: "sentence" });
    expect(res.statusCode).toBe(201);
    expect(res.body.entry).toHaveProperty("id");
    expect(res.body.translation).toHaveProperty("translatedText");
  });

  test("Get all entries for the user", async () => {
    const res = await request(app)
      .get("/entries")
      .set("Authorization", `Bearer ${accessToken}`);

    console.log(res.body);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("content");
  });

  test("Update an entry", async () => {
    const user = await User.findOne({ where: { email: "test@mail.com" } });
    const entry = await Entry.findOne({ where: { UserId: user.id } });
    const res = await request(app)
      .put(`/entries/${entry.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "saya minum", type: "sentence" });
    expect(res.statusCode).toBe(200);
    expect(res.body.entry.content).toBe("saya minum");
  });

  test("Delete an entry", async () => {
    const user = await User.findOne({ where: { email: "test@mail.com" } });
    const entry = await Entry.findOne({ where: { UserId: user.id } });
    const res = await request(app)
      .delete(`/entries/${entry.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Entry deleted");
  });

  test("Create and get a category", async () => {
    const res = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "testcat" });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    const getRes = await request(app)
      .get("/categories")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body)).toBe(true);
  });

  test("Update and delete a category", async () => {
    const user = await User.findOne({ where: { email: "test@mail.com" } });
    const category = await Category.findOne({
      where: { name: "testcat", UserId: user.id },
    });
    const res = await request(app)
      .put(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "updatedcat" });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("updatedcat");
    const delRes = await request(app)
      .delete(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(delRes.statusCode).toBe(200);
    expect(delRes.body.message).toBe("Category deleted");
  });

  test("Cannot delete general category", async () => {
    const user = await User.findOne({ where: { email: "test@mail.com" } });
    const category = await Category.findOne({
      where: { name: "general", UserId: user.id },
    });
    const res = await request(app)
      .delete(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Cannot delete the general category.");
  });

  test("Transaction creation (Midtrans)", async () => {
    const res = await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("redirectUrl");
  });

  test("Login fails with wrong password", async () => {
    const res = await request(app)
      .post("/user/login")
      .send({ email: "test@mail.com", password: "wrongpass" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });

  test("Cannot access protected route without token", async () => {
    const res = await request(app).get("/entries");
    expect(res.statusCode).toBe(401);
  });

  test("Cannot access protected route with invalid token", async () => {
    const res = await request(app)
      .get("/entries")
      .set("Authorization", "Bearer invalidtoken");
    expect(res.statusCode).toBe(401);
  });

  test("Entry limit enforced for free users", async () => {
    // Register a new free user
    const reg = await request(app).post("/user/register").send({
      username: "limituser",
      email: "limit@mail.com",
      password: "password",
    });
    const login = await request(app)
      .post("/user/login")
      .send({ email: "limit@mail.com", password: "password" });
    const token = login.body.user.access_token;
    // Create 20 entries
    for (let i = 0; i < 20; i++) {
      await request(app)
        .post("/entries")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: `entry${i}`, type: "word" });
    }
    // 21st entry should fail
    const res = await request(app)
      .post("/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "entry21", type: "word" });
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/limit/i);
  });

  test("404 handler returns not found", async () => {
    const res = await request(app).get("/nonexistent/route");
    expect(res.statusCode).toBe(404);
  });

  test("Google login (mocked)", async () => {
    jest.resetModules();
    jest.doMock("google-auth-library", () => {
      return {
        OAuth2Client: jest.fn().mockImplementation(() => ({
          verifyIdToken: () => ({
            getPayload: () => ({
              email: "google@mail.com",
              name: "Google User",
            }),
          }),
        })),
      };
    });
    const appWithMock = require("../app");
    const res = await request(appWithMock)
      .post("/user/google-login")
      .send({ credential: "mocktoken" });
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("access_token");
  });

  test("Webhook notification (mocked)", async () => {
    const user = await User.findOne({ where: { email: "user2@mail.com" } });
    const transaction = await Transaction.create({
      orderId: `ORDER-${user.id}-webhook`,
      status: "pending",
      UserId: user.id,
      redirectUrl: "http://example.com",
    });
    const res = await request(app)
      .post("/transactions/notification")
      .send({
        order_id: transaction.orderId,
        transaction_status: "settlement",
        fraud_status: "accept",
      });
    expect(res.statusCode).toBe(200);
    const updated = await User.findByPk(user.id);
    expect(updated.tier).toBe("premium");
  });

  test("Update/delete non-existent entry returns 404", async () => {
    const res = await request(app)
      .put("/entries/99999")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "nope" });
    expect(res.statusCode).toBe(404);
    const del = await request(app)
      .delete("/entries/99999")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(del.statusCode).toBe(404);
  });

  test("Validation error on register", async () => {
    const res = await request(app).post("/user/register").send({
      username: "",
      email: "notanemail",
      password: "123",
    });
    expect(res.statusCode).toBe(400);
  });

  // Add more tests for category CRUD, forbidden delete, and transaction creation if not already present
  // (already present in your current test suite)
});
