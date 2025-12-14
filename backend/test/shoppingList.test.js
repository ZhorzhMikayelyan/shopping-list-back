const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { app } = require("../server");
const ShoppingList = require("../models/ShoppingList");

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await ShoppingList.deleteMany({});
});

describe("ShoppingList uuCmd endpoints", () => {
  test("shoppingList/create - happy day", async () => {
    const res = await request(app)
      .post("/shoppingList/create")
      .send({ name: "Saturday Groceries" })
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Saturday Groceries");
    expect(res.body.state).toBe("active");
    expect(res.body.uuAppErrorMap).toEqual({});
  });

  test("shoppingList/create - invalid dtoIn (missing name)", async () => {
    const res = await request(app)
      .post("/shoppingList/create")
      .send({})
      .expect(400);

    expect(res.body.uuAppErrorMap).toHaveProperty("shoppingList/create/invalidName");
  });

  test("shoppingList/list - happy day (returns created list)", async () => {
    await ShoppingList.create({
      name: "List A",
      state: "active",
      ownerUuIdentity: "uu5:1234-5678",
      members: [{ uuIdentity: "uu5:1234-5678", role: "owner" }],
      items: [],
    });

    const res = await request(app)
      .get("/shoppingList/list")
      .expect(200);

    expect(Array.isArray(res.body.itemList)).toBe(true);
    expect(res.body.itemList.length).toBe(1);
    expect(res.body.itemList[0].name).toBe("List A");
    expect(res.body.uuAppErrorMap).toEqual({});
  });

  test("shoppingList/get - happy day", async () => {
    const created = await ShoppingList.create({
      name: "List A",
      state: "active",
      ownerUuIdentity: "uu5:1234-5678",
      members: [{ uuIdentity: "uu5:1234-5678", role: "owner" }],
      items: [],
    });

    const res = await request(app)
      .get(`/shoppingList/get/${created._id}`)
      .expect(200);

    expect(res.body.id).toBe(String(created._id));
    expect(res.body.name).toBe("List A");
    expect(res.body.uuAppErrorMap).toEqual({});
  });

  test("shoppingList/get - alternative scenario (not found)", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/shoppingList/get/${fakeId}`)
      .expect(404);

    expect(res.body.uuAppErrorMap).toHaveProperty("shoppingList/get/notFound");
  });

  test("shoppingList/update - happy day", async () => {
    const created = await ShoppingList.create({
      name: "Old name",
      state: "active",
      ownerUuIdentity: "uu5:1234-5678",
      members: [{ uuIdentity: "uu5:1234-5678", role: "owner" }],
      items: [],
    });

    const res = await request(app)
      .put(`/shoppingList/update/${created._id}`)
      .send({ name: "New name", state: "archived" })
      .expect(200);

    expect(res.body.name).toBe("New name");
    expect(res.body.state).toBe("archived");
    expect(res.body.uuAppErrorMap).toEqual({});
  });

  test("shoppingList/update - invalid dtoIn (invalid state)", async () => {
    const created = await ShoppingList.create({
      name: "Any",
      state: "active",
      ownerUuIdentity: "uu5:1234-5678",
      members: [{ uuIdentity: "uu5:1234-5678", role: "owner" }],
      items: [],
    });

    const res = await request(app)
      .put(`/shoppingList/update/${created._id}`)
      .send({ state: "deleted" })
      .expect(400);

    expect(res.body.uuAppErrorMap).toHaveProperty("shoppingList/update/invalidState");
  });

  test("shoppingList/delete - happy day", async () => {
    const created = await ShoppingList.create({
      name: "To delete",
      state: "active",
      ownerUuIdentity: "uu5:1234-5678",
      members: [{ uuIdentity: "uu5:1234-5678", role: "owner" }],
      items: [],
    });

    const res = await request(app)
      .delete(`/shoppingList/delete/${created._id}`)
      .expect(200);

    expect(res.body.deleted).toBe(true);
    expect(res.body.uuAppErrorMap).toEqual({});

    // verify really deleted
    const exists = await ShoppingList.findById(created._id);
    expect(exists).toBeNull();
  });

  test("shoppingList/delete - alternative scenario (not found)", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/shoppingList/delete/${fakeId}`)
      .expect(404);

    expect(res.body.uuAppErrorMap).toHaveProperty("shoppingList/delete/notFound");
  });
});
