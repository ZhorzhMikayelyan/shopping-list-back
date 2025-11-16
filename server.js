// server.js
// Simple API for Shopping List homework (Node + Express)
// Focus: dtoIn / dtoOut, validation, authorization – NOT full business logic.

const express = require("express");
const app = express();
const PORT = 3001;

// ---------- Helpers & config ----------

// Application profiles (roles)
const PROFILES = {
  AUTHORITIES: "Authorities",
  USER: "User",
  OWNER: "ShoppingListOwner",
  MEMBER: "ShoppingListMember",
};

const AWID = "shoppingListApp";

app.use(express.json());

// Mock authentication / authorization middleware.
// In a real app, user & profiles would come from auth token.
app.use((req, res, next) => {
  // For demo, we pretend the same user is logged in for every request.
  req.user = {
    uuIdentity: "uu5:1234-5678",
    // You can adjust profiles here to test authorization behaviour:
    profiles: [PROFILES.USER, PROFILES.OWNER],
  };
  next();
});

// Check if current user has at least one of the required profiles
function hasAnyProfile(req, requiredProfiles) {
  return requiredProfiles.some((p) => req.user.profiles.includes(p));
}

// Build uuApp-style error entry
function buildError(code, message, paramMap = {}) {
  return { type: "error", message, paramMap };
}

// Always return uuAppErrorMap in response
function buildResponse(dtoOut = {}, errorMap = {}) {
  return { ...dtoOut, uuAppErrorMap: errorMap };
}

// ---------- uuCmd: shoppingList/create ----------
// POST /shoppingList/create
app.post("/shoppingList/create", (req, res) => {
  const dtoIn = req.body;
  const errorMap = {};

  // Authorization: only logged-in users (User, Authorities)
  if (!hasAnyProfile(req, [PROFILES.USER, PROFILES.AUTHORITIES])) {
    errorMap["shoppingList/create/unauthorized"] = buildError(
      "shoppingList/create/unauthorized",
      "User is not authorized to create a shopping list."
    );
    return res.status(403).json(buildResponse({}, errorMap));
  }

  // Validation: required name (string, non-empty)
  if (!dtoIn.name || typeof dtoIn.name !== "string" || dtoIn.name.trim() === "") {
    errorMap["shoppingList/create/invalidName"] = buildError(
      "shoppingList/create/invalidName",
      "name is required and must be a non-empty string.",
      { name: dtoIn.name }
    );
    return res.status(400).json(buildResponse({}, errorMap));
  }

  // Fake created entity – real logic is out of scope of this homework
  const dtoOut = {
    awid: AWID,
    id: "list-" + Date.now(),
    name: dtoIn.name.trim(),
    state: "active",
    ownerUuIdentity: req.user.uuIdentity,
    members: [],
    items: [],
  };

  return res.json(buildResponse(dtoOut));
});

// ---------- uuCmd: shoppingList/get ----------
// GET /shoppingList/get?id=...
app.get("/shoppingList/get", (req, res) => {
  const dtoIn = req.query;
  const errorMap = {};

  if (!dtoIn.id) {
    errorMap["shoppingList/get/invalidId"] = buildError(
      "shoppingList/get/invalidId",
      "id is required.",
      { id: dtoIn.id }
    );
    return res.status(400).json(buildResponse({}, errorMap));
  }

  // Mocked list – in real app we'd read from database
  const dtoOut = {
    awid: AWID,
    id: dtoIn.id,
    name: "Example list",
    state: "active",
    ownerUuIdentity: "uu5:1234-5678",
    members: [
      { uuIdentity: "uu5:1234-5678", role: "owner" },
      { uuIdentity: "uu5:8765-4321", role: "member" },
    ],
    items: [
      { id: "i1", name: "Milk", quantity: 2, unit: "pcs", resolved: false },
      { id: "i2", name: "Bread", quantity: 1, unit: "pcs", resolved: true },
    ],
  };

  return res.json(buildResponse(dtoOut));
});

// ---------- uuCmd: shoppingList/list ----------
// GET /shoppingList/list?pageIndex=&pageSize=
app.get("/shoppingList/list", (req, res) => {
  const dtoIn = req.query;
  const errorMap = {};

  const pageIndex = Number(dtoIn.pageIndex ?? 0);
  const pageSize = Number(dtoIn.pageSize ?? 50);

  if (Number.isNaN(pageIndex) || Number.isNaN(pageSize)) {
    errorMap["shoppingList/list/invalidPageInfo"] = buildError(
      "shoppingList/list/invalidPageInfo",
      "pageIndex and pageSize must be numbers.",
      { pageIndex: dtoIn.pageIndex, pageSize: dtoIn.pageSize }
    );
    return res.status(400).json(buildResponse({}, errorMap));
  }

  // Mocked data set
  const dtoOut = {
    itemList: [
      {
        id: "list-1",
        name: "Saturday Groceries",
        state: "active",
        ownerUuIdentity: "uu5:1234-5678",
        itemCount: 5,
      },
      {
        id: "list-2",
        name: "Hiking Trip",
        state: "active",
        ownerUuIdentity: "uu5:4444-1111",
        itemCount: 3,
      },
    ],
    pageInfo: {
      pageIndex,
      pageSize,
      total: 2,
    },
  };

  return res.json(buildResponse(dtoOut));
});

// ---------- uuCmd: shoppingList/update ----------
// POST /shoppingList/update
app.post("/shoppingList/update", (req, res) => {
  const dtoIn = req.body;
  const errorMap = {};

  // Authorization: only owner or authorities
  if (!hasAnyProfile(req, [PROFILES.OWNER, PROFILES.AUTHORITIES])) {
    errorMap["shoppingList/update/unauthorized"] = buildError(
      "shoppingList/update/unauthorized",
      "User is not authorized to update the shopping list."
    );
    return res.status(403).json(buildResponse({}, errorMap));
  }

  // Validation
  if (!dtoIn.id) {
    errorMap["shoppingList/update/invalidId"] = buildError(
      "shoppingList/update/invalidId",
      "id is required.",
      { id: dtoIn.id }
    );
  }

  if (!dtoIn.name || typeof dtoIn.name !== "string" || dtoIn.name.trim() === "") {
    errorMap["shoppingList/update/invalidName"] = buildError(
      "shoppingList/update/invalidName",
      "name is required and must be a non-empty string.",
      { name: dtoIn.name }
    );
  }

  if (Object.keys(errorMap).length > 0) {
    return res.status(400).json(buildResponse({}, errorMap));
  }

  const dtoOut = {
    awid: AWID,
    id: dtoIn.id,
    name: dtoIn.name.trim(),
    state: "active",
    ownerUuIdentity: req.user.uuIdentity,
  };

  return res.json(buildResponse(dtoOut));
});

// ---------- uuCmd: shoppingList/delete ----------
// POST /shoppingList/delete
app.post("/shoppingList/delete", (req, res) => {
  const dtoIn = req.body;
  const errorMap = {};

  // Authorization: only owner or authorities
  if (!hasAnyProfile(req, [PROFILES.OWNER, PROFILES.AUTHORITIES])) {
    errorMap["shoppingList/delete/unauthorized"] = buildError(
      "shoppingList/delete/unauthorized",
      "User is not authorized to delete the shopping list."
    );
    return res.status(403).json(buildResponse({}, errorMap));
  }

  if (!dtoIn.id) {
    errorMap["shoppingList/delete/invalidId"] = buildError(
      "shoppingList/delete/invalidId",
      "id is required.",
      { id: dtoIn.id }
    );
    return res.status(400).json(buildResponse({}, errorMap));
  }

  const dtoOut = {
    awid: AWID,
    id: dtoIn.id,
    deleted: true,
  };

  return res.json(buildResponse(dtoOut));
});

// ---------- uuCmd: shoppingList/addMember ----------
// POST /shoppingList/addMember
app.post("/shoppingList/addMember", (req, res) => {
  const dtoIn = req.body;
  const errorMap = {};

  // Only owner or authorities can add members
  if (!hasAnyProfile(req, [PROFILES.OWNER, PROFILES.AUTHORITIES])) {
    errorMap["shoppingList/addMember/unauthorized"] = buildError(
      "shoppingList/addMember/unauthorized",
      "User is not authorized to add members."
    );
    return res.status(403).json(buildResponse({}, errorMap));
  }

  if (!dtoIn.listId) {
    errorMap["shoppingList/addMember/invalidListId"] = buildError(
      "shoppingList/addMember/invalidListId",
      "listId is required.",
      { listId: dtoIn.listId }
    );
  }

  if (!dtoIn.uuIdentity || typeof dtoIn.uuIdentity !== "string") {
    errorMap["shoppingList/addMember/invalidUuIdentity"] = buildError(
      "shoppingList/addMember/invalidUuIdentity",
      "uuIdentity is required and must be a string.",
      { uuIdentity: dtoIn.uuIdentity }
    );
  }

  if (Object.keys(errorMap).length > 0) {
    return res.status(400).json(buildResponse({}, errorMap));
  }

  const dtoOut = {
    awid: AWID,
    listId: dtoIn.listId,
    member: {
      uuIdentity: dtoIn.uuIdentity,
      role: dtoIn.role || "member",
    },
  };

  return res.json(buildResponse(dtoOut));
});

// ---------- uuCmd: shoppingList/removeMember ----------
// POST /shoppingList/removeMember
app.post("/shoppingList/removeMember", (req, res) => {
  const dtoIn = req.body;
  const errorMap = {};

  if (!hasAnyProfile(req, [PROFILES.OWNER, PROFILES.AUTHORITIES])) {
    errorMap["shoppingList/removeMember/unauthorized"] = buildError(
      "shoppingList/removeMember/unauthorized",
      "User is not authorized to remove members."
    );
    return res.status(403).json(buildResponse({}, errorMap));
  }

  if (!dtoIn.listId) {
    errorMap["shoppingList/removeMember/invalidListId"] = buildError(
      "shoppingList/removeMember/invalidListId",
      "listId is required.",
      { listId: dtoIn.listId }
    );
  }

  if (!dtoIn.uuIdentity) {
    errorMap["shoppingList/removeMember/invalidUuIdentity"] = buildError(
      "shoppingList/removeMember/invalidUuIdentity",
      "uuIdentity is required.",
      { uuIdentity: dtoIn.uuIdentity }
    );
  }

  if (Object.keys(errorMap).length > 0) {
    return res.status(400).json(buildResponse({}, errorMap));
  }

  const dtoOut = {
    awid: AWID,
    listId: dtoIn.listId,
    removedUuIdentity: dtoIn.uuIdentity,
  };

  return res.json(buildResponse(dtoOut));
});

// ---------- uuCmd: shoppingList/leave ----------
// POST /shoppingList/leave
app.post("/shoppingList/leave", (req, res) => {
  const dtoIn = req.body;
  const errorMap = {};

  if (!dtoIn.listId) {
    errorMap["shoppingList/leave/invalidListId"] = buildError(
      "shoppingList/leave/invalidListId",
      "listId is required.",
      { listId: dtoIn.listId }
    );
    return res.status(400).json(buildResponse({}, errorMap));
  }

  // Any logged-in user can attempt to leave
  const dtoOut = {
    awid: AWID,
    listId: dtoIn.listId,
    leftUuIdentity: req.user.uuIdentity,
  };

  return res.json(buildResponse(dtoOut));
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`Shopping List API is running at http://localhost:${PORT}`);
});
