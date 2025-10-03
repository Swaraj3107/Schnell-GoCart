// ====================== app.js ======================
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
const MongoStore = require("connect-mongo");

// Models
const User = require("./models/user");
const Product = require("./models/product");

// ================== ENV VARIABLES ==================
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET || "defaultsecret";

// ================== DB CONNECTION ==================
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ DB Connection Failed:", err);
    process.exit(1);
  });

// ================== VIEW ENGINE ==================
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// ================== MIDDLEWARES ==================
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ================== TRUST PROXY ==================
app.set("trust proxy", 1); // Required for Render to handle secure cookies

// ================== SESSION ==================
app.use(
  session({
    name: "session",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      //  secure: false,
      secure: process.env.NODE_ENV === "production",
      
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// ================== FLASH ==================
app.use(flash());

// ================== PASSPORT ==================
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ================== GLOBAL VARIABLES ==================
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user || null;
  next();
});

// ================== ROUTES ==================

// Home
app.get("/", (req, res) => {
  res.render("home");
});

// Register
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

// Login
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

// Listings (Protected)
app.get("/listings", isLoggedIn, async (req, res) => {
  const products = await Product.find({});
  res.render("list", { products });
});

// Profile (Protected)
app.get("/profile", isLoggedIn, (req, res) => {
  res.send(`Welcome ${req.user.username}, your email is ${req.user.email}`);
});

// ================== FLASH TEST ROUTE ==================
app.get("/flash-test", (req, res) => {
  req.flash("success", "🎉 Flash is working on Render!");
  res.redirect("/");
});

// ================== MIDDLEWARE ==================
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash("error", "You must be signed in to access that page.");
  res.redirect("/login");
}

// ================== SERVER ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
