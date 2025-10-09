import mongoose from "mongoose";

// for stock
const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: {type: String, required: true, unique: true},
  stock: { type: Number, required: true, default: 0 },
});

export default mongoose.model("Product", productSchema);
