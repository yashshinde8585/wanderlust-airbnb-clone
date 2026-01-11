const User = require("../models/user");

// Render the signup form
module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

// Handle user signup
module.exports.signup = async (req, res) => {
  const { username, email, password } = req.body; // Extract user data from request body
  try {
    const newUser = new User({ email, username }); // Create a new user instance
    const registeredUser = await User.register(newUser, password); // Register user with hashed password

    req.login(registeredUser, (err) => {
      // Automatically log in user after registration
      if (err) {
        req.flash("error", err.message);
        return res.redirect("/signup");
      }
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings"); // Redirect to the listings page
    });
  } catch (error) {
    req.flash("error", error.message); // Handle signup errors
    res.redirect("/signup"); // Redirect back to signup form on error
  }
};

// Render the login form
module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

// Handle user login
module.exports.login = async (req, res) => {
  req.flash("success", "Welcome back!"); // Flash success message on login
  // redirectUrl is set in res.locals by saveRedirectUrl middleware
  const redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl); // Redirect user
};

// Handle user logout
module.exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      req.flash("error", "Something went wrong. Please try again."); // Handle logout errors
      return res.redirect("/listings");
    }
    req.flash("success", "You have logged out!"); // Flash success message on logout
    res.redirect("/listings"); // Redirect to listings page
  });
};
