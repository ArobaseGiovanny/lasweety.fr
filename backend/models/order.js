import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  stripeSessionId: { type: String, required: true, unique: true },

  stripePaymentIntentId: { type: String },
  stripeCustomerId: { type: String },

  products: [
    {
      id: String,
      name: String,
      quantity: Number,
      price: Number,
    },
  ],


  parcel: {
    weightKg: Number,     
    lengthCm: Number,     
    widthCm: Number,
    heightCm: Number,
    packageType: String,  // "SMALL" | "LARGE"
  },

  total: Number,
  customerPhone: String, 
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

  deliveryMode: { type: String, enum: ["home", "pickup"], required: true, default: "home" },
  pickupPoint: {
    id: String,
    name: String,
    address: String,
    zip: String,
    city: String,
    lat: Number,
    lng: Number,
    carrier: String,
    postNumber: String,
  },

  status: {
    type: String,
    enum: ["pending", "processing", "paid", "canceled", "refunded"],
    default: "pending",
  },
  

  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date, default: null },
  emailAttempts: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }, 
});

orderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

orderSchema.index({ status: 1, createdAt: -1 }); // pour les vues back-office
orderSchema.index({ customerEmail: 1, createdAt: -1 });

export default mongoose.model("order", orderSchema);
