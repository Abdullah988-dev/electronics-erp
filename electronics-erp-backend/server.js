const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connectDB } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const customerRoutes = require("./routes/customerRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const shopInRoutes = require("./routes/shopInRoutes");
const shopOutRoutes = require("./routes/shopOutRoutes");

const app = express();

// =======================
// CORS Configuration
// =======================
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "https://your-frontend-name.vercel.app", // Deploy ke baad actual Vercel URL yahan likhna
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Postman ya server-to-server requests ke liye
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// =======================
// Health Check
// =======================
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running ✅" });
});

// =======================
// API Routes
// =======================
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/shop-in", shopInRoutes);
app.use("/api/shop-out", shopOutRoutes);

// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Server failed to start due to DB connection error");
    console.error(err);
  });