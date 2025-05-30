const request = require("supertest");
const app = require("../app");
const {
  User,
  Entry,
  Category,
  Translation,
  EntryCategory,
} = require("../models");
const { createTestUser, generateToken } = require("./setup");

require("./setup");

describe("End-to-End Workflow Tests", () => {
  describe("Complete User Journey", () => {
    let user;
    let token;
    it("should support complete user workflow from registration to premium upgrade", async () => {
      // 1. Register a new user
      const userData = {
        username: "journeyuser",
        email: "journey@example.com",
        password: "password123",
      };

      const registerResponse = await request(app)
        .post("/user/register")
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty(
        "message",
        "User registered successfully"
      );
      user = registerResponse.body.user;

      // 2. Login with the user
      const loginResponse = await request(app)
        .post("/user/login")
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      token = loginResponse.body.user.access_token;
      expect(token).toBeTruthy();

      // 3. Get initial categories (should have 'general')
      const categoriesResponse = await request(app)
        .get("/categories")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(categoriesResponse.body.length).toBe(1);
      expect(categoriesResponse.body[0].name).toBe("general");
      const generalCategory = categoriesResponse.body[0];

      // 4. Create custom categories
      const workCategoryResponse = await request(app)
        .post("/categories")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "work" })
        .expect(201);

      const personalCategoryResponse = await request(app)
        .post("/categories")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "personal" })
        .expect(201);

      // 5. Create entries with different categories
      const entry1Response = await request(app)
        .post("/entries")
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Hello world",
          type: "text",
          categoryIds: [workCategoryResponse.body.id],
        })
        .expect(201);

      const entry2Response = await request(app)
        .post("/entries")
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Personal note",
          type: "text",
          categoryNames: ["personal", "diary"],
        })
        .expect(201);

      // 6. Get all entries
      const entriesResponse = await request(app)
        .get("/entries")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(entriesResponse.body.length).toBe(2);
      expect(entriesResponse.body[0]).toHaveProperty("Translation");
      expect(entriesResponse.body[0]).toHaveProperty("Categories");

      // 7. Update an entry
      const updateResponse = await request(app)
        .put(`/entries/${entry1Response.body.entry.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Updated hello world",
          categoryIds: [generalCategory.id, personalCategoryResponse.body.id],
        })
        .expect(200);

      expect(updateResponse.body.entry.content).toBe("Updated hello world");

      // 8. Create a transaction for premium upgrade
      const transactionResponse = await request(app)
        .post("/transactions")
        .set("Authorization", `Bearer ${token}`)
        .expect(201);

      expect(transactionResponse.body).toHaveProperty("redirect_url");

      // 9. Get transactions
      const transactionsResponse = await request(app)
        .get("/transactions")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(transactionsResponse.body.length).toBe(1);
      const transaction = transactionsResponse.body[0];

      // 10. Simulate successful payment notification
      const notificationResponse = await request(app)
        .post("/transactions/notification")
        .send({
          order_id: transaction.orderId,
          transaction_status: "settlement",
          fraud_status: "accept",
        })
        .expect(200);

      // 11. Verify user was upgraded to premium
      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.tier).toBe("premium");

      // 12. Create more entries (should not be limited now)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post("/entries")
          .set("Authorization", `Bearer ${token}`)
          .send({
            content: `Premium entry ${i}`,
            type: "text",
          })
          .expect(201);
      }

      // 13. Verify all entries exist
      const finalEntriesResponse = await request(app)
        .get("/entries")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(finalEntriesResponse.body.length).toBe(5); // 2 initial + 3 premium

      // 14. Delete an entry
      await request(app)
        .delete(`/entries/${entry1Response.body.entry.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // 15. Verify deletion
      const finalCheckResponse = await request(app)
        .get("/entries")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(finalCheckResponse.body.length).toBe(4);
    }, 30000); // 30 second timeout for this test
  });

  describe("Free User Limitations", () => {
    let user;
    let token;

    beforeEach(async () => {
      const userData = {
        username: "freeuser",
        email: "free@example.com",
        password: "password123",
      };

      const registerResponse = await request(app)
        .post("/user/register")
        .send(userData);

      user = registerResponse.body.user;

      const loginResponse = await request(app).post("/user/login").send({
        email: userData.email,
        password: userData.password,
      });

      token = loginResponse.body.user.access_token;
    });

    it("should enforce entry limit for free users", async () => {
      // Create 5 entries (free limit)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post("/entries")
          .set("Authorization", `Bearer ${token}`)
          .send({
            content: `Entry ${i}`,
            type: "text",
          })
          .expect(201);
      }

      // Try to create 6th entry
      const response = await request(app)
        .post("/entries")
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "This should fail",
          type: "text",
        })
        .expect(403);

      expect(response.body.message).toMatch(/limit/i);
    }, 25000); // 25 second timeout for this test
  });

  describe("Data Integrity Tests", () => {
    let user;
    let token;

    beforeEach(async () => {
      const userData = {
        username: "datauser",
        email: "data@example.com",
        password: "password123",
      };

      const registerResponse = await request(app)
        .post("/user/register")
        .send(userData);

      user = registerResponse.body.user;

      const loginResponse = await request(app).post("/user/login").send({
        email: userData.email,
        password: userData.password,
      });

      token = loginResponse.body.user.access_token;
    });

    it("should maintain data consistency when deleting entries", async () => {
      // Create entry with translation and categories
      const entryResponse = await request(app)
        .post("/entries")
        .set("Authorization", `Bearer ${token}`)
        .send({
          content: "Test entry with relations",
          type: "text",
          categoryNames: ["work", "important"],
        })
        .expect(201);

      const entryId = entryResponse.body.entry.id;

      // Verify related data exists
      const translation = await Translation.findOne({
        where: { EntryId: entryId },
      });
      const entryCategories = await EntryCategory.findAll({
        where: { EntryId: entryId },
      });

      expect(translation).toBeTruthy();
      expect(entryCategories.length).toBeGreaterThan(0);

      // Delete entry
      await request(app)
        .delete(`/entries/${entryId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Verify related data was cleaned up
      const deletedTranslation = await Translation.findOne({
        where: { EntryId: entryId },
      });
      const deletedEntryCategories = await EntryCategory.findAll({
        where: { EntryId: entryId },
      });

      expect(deletedTranslation).toBeFalsy();
      expect(deletedEntryCategories.length).toBe(0);

      // Verify categories themselves still exist (should not be deleted)
      const workCategory = await Category.findOne({
        where: { name: "work", UserId: user.id },
      });
      expect(workCategory).toBeTruthy();
    });

    it("should prevent deletion of general category", async () => {
      const generalCategory = await Category.findOne({
        where: { name: "general", UserId: user.id },
      });

      const response = await request(app)
        .delete(`/categories/${generalCategory.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body.message).toMatch(/general/i);

      // Verify category still exists
      const stillExists = await Category.findByPk(generalCategory.id);
      expect(stillExists).toBeTruthy();
    });
  });
});
