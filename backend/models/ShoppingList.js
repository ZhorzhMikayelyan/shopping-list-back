// models/ShoppingList.js
const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: "pcs" },
    resolved: { type: Boolean, default: false },
  },
  { _id: true } // у каждого item будет свой id
);

const MemberSchema = new mongoose.Schema(
  {
    uuIdentity: { type: String, required: true },
    role: { type: String, enum: ["owner", "member"], default: "member" },
  },
  { _id: false }
);

const ShoppingListSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    state: { type: String, enum: ["active", "archived"], default: "active" },
    ownerUuIdentity: { type: String, required: true },
    members: [MemberSchema],
    items: [ItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShoppingList", ShoppingListSchema);
