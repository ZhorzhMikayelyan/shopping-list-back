// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const ShoppingList = require("./models/ShoppingList");

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

// middleware
app.use(cors());
app.use(express.json());

// helper для возвращаемой структуры
function buildResponse(data, errorMap = {}) {
  return { ...data, uuAppErrorMap: errorMap };
}

// mock owner
const MOCK_OWNER = "uu5:1234-5678";

// ====================================================================
// 1) shoppingList/list  (GET /shoppingList/list)
// ====================================================================
app.get("/shoppingList/list", async (req, res) => {
  try {
    const lists = await ShoppingList.find().lean();

    const dtoOut = {
      itemList: lists.map((l) => ({
        id: l._id.toString(),
        name: l.name,
        state: l.state,
        ownerUuIdentity: l.ownerUuIdentity,
        itemCount: l.items.length,
      })),
    };

    res.json(buildResponse(dtoOut));
  } catch (err) {
    console.error(err);
    res.status(500).json(
      buildResponse({}, {
        "shoppingList/list/failed": {
          type: "error",
          message: "Unexpected error while listing shopping lists.",
        },
      })
    );
  }
});

// ====================================================================
// 2) shoppingList/get  (GET /shoppingList/get/:id)
// ====================================================================
app.get("/shoppingList/get/:id", async (req, res) => {
  const errorMap = {};
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    errorMap["shoppingList/get/invalidId"] = {
      type: "error",
      message: "id is not a valid ObjectId.",
      paramMap: { id },
    };
    return res.status(400).json(buildResponse({}, errorMap));
  }

  try {
    const list = await ShoppingList.findById(id).lean();

    if (!list) {
      errorMap["shoppingList/get/notFound"] = {
        type: "error",
        message: "Shopping list not found.",
        paramMap: { id },
      };
      return res.status(404).json(buildResponse({}, errorMap));
    }

    const dtoOut = {
      id: list._id.toString(),
      name: list.name,
      state: list.state,
      ownerUuIdentity: list.ownerUuIdentity,
      members: list.members,
      items: list.items,
    };

    res.json(buildResponse(dtoOut));
  } catch (err) {
    console.error(err);
    res.status(500).json(
      buildResponse({}, {
        "shoppingList/get/failed": {
          type: "error",
          message: "Unexpected error while getting shopping list.",
        },
      })
    );
  }
});

// ====================================================================
// 3) shoppingList/create  (POST /shoppingList/create)
// ====================================================================
app.post("/shoppingList/create", async (req, res) => {
  const errorMap = {};
  const { name } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    errorMap["shoppingList/create/invalidName"] = {
      type: "error",
      message: "name is required and must be a non-empty string.",
      paramMap: { name },
    };
    return res.status(400).json(buildResponse({}, errorMap));
  }

  try {
    const list = await ShoppingList.create({
      name: name.trim(),
      state: "active",
      ownerUuIdentity: MOCK_OWNER,
      members: [{ uuIdentity: MOCK_OWNER, role: "owner" }],
      items: [],
    });

    const dtoOut = {
      id: list._id.toString(),
      name: list.name,
      state: list.state,
      ownerUuIdentity: list.ownerUuIdentity,
      members: list.members,
      items: list.items,
    };

    res.status(201).json(buildResponse(dtoOut));
  } catch (err) {
    console.error(err);
    res.status(500).json(
      buildResponse({}, {
        "shoppingList/create/failed": {
          type: "error",
          message: "Unexpected error while creating shopping list.",
        },
      })
    );
  }
});

// ====================================================================
// 4) shoppingList/update  (PUT /shoppingList/update/:id)
// ====================================================================
app.put("/shoppingList/update/:id", async (req, res) => {
  const errorMap = {};
  const { id } = req.params;
  const { name, state } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    errorMap["shoppingList/update/invalidId"] = {
      type: "error",
      message: "id is not a valid ObjectId.",
      paramMap: { id },
    };
  }

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    errorMap["shoppingList/update/invalidName"] = {
      type: "error",
      message: "name must be a non-empty string, if provided.",
      paramMap: { name },
    };
  }

  if (state !== undefined && !["active", "archived"].includes(state)) {
    errorMap["shoppingList/update/invalidState"] = {
      type: "error",
      message: "state must be 'active' or 'archived', if provided.",
      paramMap: { state },
    };
  }

  if (Object.keys(errorMap).length > 0) {
    return res.status(400).json(buildResponse({}, errorMap));
  }

  try {
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (state !== undefined) updates.state = state;

    const list = await ShoppingList.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!list) {
      errorMap["shoppingList/update/notFound"] = {
        type: "error",
        message: "Shopping list not found.",
        paramMap: { id },
      };
      return res.status(404).json(buildResponse({}, errorMap));
    }

    const dtoOut = {
      id: list._id.toString(),
      name: list.name,
      state: list.state,
      ownerUuIdentity: list.ownerUuIdentity,
      members: list.members,
      items: list.items,
    };

    res.json(buildResponse(dtoOut));
  } catch (err) {
    console.error(err);
    res.status(500).json(
      buildResponse({}, {
        "shoppingList/update/failed": {
          type: "error",
          message: "Unexpected error while updating shopping list.",
        },
      })
    );
  }
});

// ====================================================================
// 5) shoppingList/delete  (DELETE /shoppingList/delete/:id)
// ====================================================================
app.delete("/shoppingList/delete/:id", async (req, res) => {
  const errorMap = {};
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    errorMap["shoppingList/delete/invalidId"] = {
      type: "error",
      message: "id is not a valid ObjectId.",
      paramMap: { id },
    };
    return res.status(400).json(buildResponse({}, errorMap));
  }

  try {
    const list = await ShoppingList.findByIdAndDelete(id).lean();

    if (!list) {
      errorMap["shoppingList/delete/notFound"] = {
        type: "error",
        message: "Shopping list not found.",
        paramMap: { id },
      };
      return res.status(404).json(buildResponse({}, errorMap));
    }

    const dtoOut = { id: list._id.toString(), deleted: true };
    res.json(buildResponse(dtoOut));
  } catch (err) {
    console.error(err);
    res.status(500).json(
      buildResponse({}, {
        "shoppingList/delete/failed": {
          type: "error",
          message: "Unexpected error while deleting shopping list.",
        },
      })
    );
  }
});

// ✅ Export app for unit tests
module.exports = { app, buildResponse };

// ✅ Start server only when executed directly (not when imported by Jest)
if (require.main === module) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log("✅ Connected to MongoDB");
      app.listen(PORT, () => {
        console.log(`🚀 API listening at http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err);
      process.exit(1);
    });
}
