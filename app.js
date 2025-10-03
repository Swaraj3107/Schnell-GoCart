// Load Environment Variables
require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const path = require("path");
const ejsMate = require("ejs-mate");
const flash = require("connect-flash");

// Models
const Product = require("./models/product.js");
const User = require("./models/user.js");

// ENV Variables
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET || "defaultsecret";

// ================== DB Connection ==================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsAllowInvalidCertificates: false, // keep false for security
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ DB Connection Failed:", err);
    process.exit(1);
  });


// ================== View Engine ==================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.engine("ejs", ejsMate);

// ================== Middlewares ==================
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevent client-side JS access
      secure: false,
      secure: process.env.NODE_ENV === "production", // Secure cookies in production
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

app.use(flash());

// ================== Passport ==================
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Globals for Templates
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});

// ================== Routes ==================

// Home
app.get("/", (req, res) => {
  res.render("home.ejs");
});

// Show All Items
app.get("/listings", isLoggedIn, async (req, res) => {
  const products = await Product.find({});
  res.render("list.ejs", { products });
});

// Checkout Page
app.get("/checkOut", isLoggedIn, (req, res) => {
  res.render("pay.ejs");
});

// Register User
app.get("/register", (req, res) => res.render("register"));
app.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    const registeredUser = await User.register(user, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome! You are now registered.");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/register");
  }
});

// Login User
app.get("/login", (req, res) => res.render("login"));
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: "Invalid username or password.",
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");
    res.redirect("/listings");
  }
);

// Logout
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "You have been logged out.");
    res.redirect("/login");
  });
});

// Profile
app.get("/profile", isLoggedIn, (req, res) => {
  res.send(`Welcome ${req.user.username}, your email is ${req.user.email}`);
});

// ================== API Routes (Smart Cart) ==================
function authenticateApiKey(req, res, next) {
  const authHeader = req.headers["authorization"];
  const apiKey = authHeader && authHeader.split(" ")[1];

  if (apiKey === process.env.API_KEY) return next();
  res.status(401).json({ message: "Unauthorized: Invalid API Key" });
}

app.post("/api/cart/add", authenticateApiKey, async (req, res) => {
  try {
    const { userId, productId } = req.body;
    if (!userId || !productId)
      return res.status(400).json({ message: "Missing userId or productId" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Prevent duplicate entries
    const alreadyInCart = user.cart.some(
      (item) => item.toString() === productId.toString()
    );
    if (alreadyInCart)
      return res.status(400).json({ message: "Product already in cart" });

    user.cart.push(product);
    await user.save();

    console.log(`📦 Product ${product.title} added to ${user.username}'s cart`);
    res.status(200).json({ success: true, message: "Product added to cart" });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ================== Middleware ==================
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash("error", "You must be signed in to access that page.");
  res.redirect("/login");
}

// ================== Server ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
