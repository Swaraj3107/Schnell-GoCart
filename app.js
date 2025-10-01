// const express = require("express");
// const app = express();
// const port = 8080;

// const Product = require("./models/product.js");
// const User = require("./models/user.js");
// const mongoose = require("mongoose");
// const session = require("express-session");
// const passport = require("passport");
// const LocalStrategy = require("passport-local");
// const path = require("path");
// const ejsMate = require("ejs-mate");


// // Connect to MongoDB
// main()
//   .then(() => {
//     console.log("Connected to DB");
//   })
//   .catch((err) => {
//     console.log(err);
//   });

// async function main() {
//   await mongoose.connect("mongodb://127.0.0.1:27017/cart");
// }

// // View Engine Setup
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "/views"));
// app.engine("ejs", ejsMate);

// // Middlewares
// app.use(express.static(path.join(__dirname, "/public")));
// app.use(express.urlencoded({ extended: true })); // for form data
// app.use(express.json()); // for JSON data


// const  flash=require("connect-flash");
// app.use(
//   session({
//     secret: "yoursecret", // change this to something secure
//     resave: false,
//     saveUninitialized: true,
//   })
// );

// app.use(flash());
// // Passport Setup

// app.use(passport.initialize());
// app.use(passport.session());
// passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());



// /* ----------------- ROUTES ----------------- */

// // Add Item to DB
// app.post("/addItem", async (req, res) => {
//   const { title, weight, price } = req.body;
//   const newProduct = new Product(req.body);
//   await newProduct.save();
//   res.redirect("/listings");
// });



// app.use((req,res,next)=>{//Middle ware for success for flash
//   res.locals.success=req.flash("success");
//   res.locals.error=req.flash("error");
//   next();
// })

// // Show All Items
// app.get("/listings", isLoggedIn, async (req, res) => {
//   const products = await Product.find({});
//   res.render("list.ejs", { products });
// });

// // Checkout Page
// app.get("/checkOut", isLoggedIn, (req, res) => {
//   res.render("pay.ejs");
// });

// // Home Page
// app.get("/home", (req, res) => {
//   res.render("home.ejs");
// });

// // Register User
// app.get("/register", (req, res) => {
//   res.render("register");
// });

// app.post("/register", async (req, res, next) => {
//   try {
//     const { username, email, password } = req.body;
//     const user = new User({ username, email });
//     const registeredUser = await User.register(user, password);
//     req.login(registeredUser, (err) => {
//       if (err) return next(err);
//         req.flash("success", "Welcome! You are now registered.");
//       res.redirect("/listings");
//     });
//   } catch (e) {
    
//     req.flash("error", e.message);
//     res.redirect("/register");
//   }
// });

// // Login User
// app.get("/login", (req, res) => {
//   res.render("login.ejs");
// });

// // CORRECT
// app.post(
//   "/login",
//   passport.authenticate("local", {
//     // The redirect URL path
//     failureRedirect: "/login",
//     // The flash message string
//     failureFlash: "Invalid username or password. Please try again or register.",
//   }),
//   (req, res) => {
//     req.flash("success", "Welcome back!");
//     res.redirect("/listings");
//   }
// );

// // Logout
// app.get("/logout", (req, res, next) => {
//   req.logout(function (err) {
//     if (err) return next(err);
//     req.flash("success", "You have been logged out.");
//     res.redirect("/login");
//   });
// });

// // Profile
// app.get("/profile", isLoggedIn, (req, res) => {
//   res.send(`Welcome ${req.user.username}, your email is ${req.user.email}`);
// });

// /* ----------------- MIDDLEWARE ----------------- */
// function isLoggedIn(req, res, next) {
//   if (req.isAuthenticated()) return next();
//   req.flash("error", "You must be signed in to access that page.");
//   res.redirect("/login");
// }

// /* ----------------- SERVER ----------------- */
// app.listen(port, () => {
//   console.log(`App is listening on port: ${port}`);
// });

// NEW: Configure environment variables at the very top
require('dotenv').config();

const express = require("express");
const app = express();
const port = 8080;

const Product = require("./models/product.js");
const User = require("./models/user.js");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const path = require("path");
const ejsMate = require("ejs-mate");

// Connect to MongoDB
main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/cart");
}

// View Engine Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.engine("ejs", ejsMate);

// Middlewares
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const flash = require("connect-flash");
app.use(
  session({
    // CHANGED: Using the secret from your .env file
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(flash());
// Passport Setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// CHANGED: Updated middleware to include the current user for the navbar
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user; // Makes user info available in all templates
  next();
});

/* =================================================== */
/* ROUTES FOR WEBSITE USERS (EJS PAGES)                */
/* =================================================== */

// CHANGED: Home page route is now the root '/'
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
app.get("/register", (req, res) => {
  res.render("register");
});

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
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: "Invalid username or password. Please try again or register.",
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");
    res.redirect("/listings");
  }
);

// Logout
app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.flash("success", "You have been logged out.");
    res.redirect("/login");
  });
});

// Profile
app.get("/profile", isLoggedIn, (req, res) => {
  res.send(`Welcome ${req.user.username}, your email is ${req.user.email}`);
});

/* =================================================== */
/* API ROUTES FOR THE RASPBERRY PI SMART CART          */
/* =================================================== */

// NEW: API Key authentication middleware
function authenticateApiKey(req, res, next) {
    const authHeader = req.headers['authorization'];
    // Expected header format: "Authorization: ApiKey your-super-secret-random-string-12345"
    const apiKey = authHeader && authHeader.split(' ')[1];

    if (apiKey === process.env.API_KEY) {
        next(); // Key is valid, proceed
    } else {
        res.status(401).json({ message: "Unauthorized: Invalid API Key" });
    }
}

// NEW: API endpoint for adding a product from the cart scanner
app.post("/api/cart/add", authenticateApiKey, async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // This assumes you have a 'cart' array in your User model
        user.cart.push(product);
        await user.save();

        console.log(`Product ${product.title} added to ${user.username}'s cart via API.`);
        res.status(200).json({ success: true, message: "Product added to cart." });
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* ----------------- MIDDLEWARE ----------------- */
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash("error", "You must be signed in to access that page.");
  res.redirect("/login");
}

/* ----------------- SERVER ----------------- */
app.listen(port, () => {
  console.log(`App is listening on port: ${port}`);
});