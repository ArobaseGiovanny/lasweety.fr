import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({

  orderNumber: { type: String, unique: true },
  stripeSessionId: { type: String, required: true, unique: true },
  
  products: [
    {
      id: String,
      name: String,
      quantity: Number,
      price: Number,
    },
  ],
  total: Number,
  customerEmail: String,
  customerName: String, 

  shippingAddress: {
    line1: String,
    line2: String,
    city: String,
    postal_code: String,
    country: String,
  },
  billingAddress: {
    line1: String,
    line2: String,
    city: String,
    postal_code: String,
    country: String,
  },

  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);
