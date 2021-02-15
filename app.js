//jshint esversion:6
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const md5 = require("md5");

const app = express();

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));

//!Cookie and Session
app.use(
  session({
    secret: "ThisIsMySecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

//!DATABASE
mongoose.connect("mongodb+srv://phanith:123456789q@cluster0.utojs.mongodb.net/onlineshopdb", { useNewUrlParser: true, useUnifiedTopology: true });
const adminUserSchema = new mongoose.Schema({
  username: String,
  password: String
});
const AdminUser = mongoose.model("AdminUser",adminUserSchema);
const categorySchema = new mongoose.Schema({
  categoryName: String,
});
const Categories = mongoose.model("Category", categorySchema);
// Categories.insertMany([
//   { categoryName: "Electronics" },
//   { categoryName: "Hand Bags" },
//   { categoryName: "Wallet" },
//   { categoryName: "Clothes" },
// ]);
const productSchema = new mongoose.Schema({
  productName: String,
  image: String,
  pricePerProduct: Number,
  promotion: Number,
  quantity: Number,
  category: String,
  instockAt: String,
  detail: String,
});
const Products = mongoose.model("Product", productSchema);
const promotionSchema = new mongoose.Schema({
  discount: Number,
  forCategory: String,
  byAdmin: String,
  description: String,
  startDate: String,
  endDate: String,
});
const Promotion = mongoose.model("Promotion", promotionSchema);
// const pro = new Promotion({
//   discount: 0.3,
//   forCategory: "Clothes",
//   byAmin: "Phanith",
//   description: "Lunar New Year",
//   startDate: getDate(),
//   endDate: "February 20, 2021"
// });
// pro.save();
const cartSchema = new mongoose.Schema({
  productId: String,
  newQuantity: Number,
  totalprice: Number,
});
const Cart = mongoose.model("Cart", cartSchema);
const purchaseSchema = new mongoose.Schema({
  products: [productSchema],
  shippingCountry: String,
  shippingCity: String,
  shippingContact: String,
});
const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  password: String,
  purchase: [purchaseSchema],
  carts: [cartSchema],
});
//!plugin passport
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

//!set strategy
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//!DATE GENERATOR
function getDate() {
  var options = { year: "numeric", month: "long", day: "numeric" };
  var today = new Date();
  return today.toLocaleDateString("en-US", options);
}

//!ADMIN AREA
//TODO: admin login, CRUD on user, Purchase order
app.get("/admin", (req,res)=>{
  res.render("admin/login");
});
app.get("/admin/register", (req,res)=>{
  res.render("admin/register");
});
app.get("/admin/products",(req,res)=>{
  Products.find({}, (err, product) => {
    if (!err) {
      res.render("admin/products", { products: product });
    }
  });
});
app.post("/admin/login", (req,res)=>{
  const password = req.body.password;
  AdminUser.findOne({username: req.body.username},(err,admin)=>{
    if(!err){
      if(admin.password === md5(password)){
        Products.find({}, (err, product) => {
          if (!err) {
            res.render("admin/products", { products: product });
          }
        });
      }else{
        res.redirect("/admin/register");
      }
    }
  });
});
app.post("/admin/register", (req,res)=>{
  const admin = new AdminUser({
    username: req.body.username,
    password: md5(req.body.password)
  });
  admin.save(()=>{
    res.redirect("/admin");
  });
});

app.get("/addproduct", (req, res) => {
  Categories.find({}, (err, category) => {
    if (!err) {
      res.render("admin/addproduct", { category: category });
    }
  });
});

app.post("/addproduct", (req, res) => {
  const product = new Products({
    productName: req.body.productName,
    image: "man.jpg",
    quantity: req.body.quantity,
    pricePerProduct: req.body.pricePerProduct,
    promotion: (req.body.promotion/100),
    category: req.body.category,
    instockAt: getDate(),
    detail: req.body.detail,
  });
  product.save((err) => {
    if (!err) {
      res.redirect("/admin/products");
    }
  });
});

app.get("/delete/:productId", (req, res) => {
  const productID = req.params.productId;
  Products.findByIdAndDelete(productID, (err) => {
    if (!err) {
      res.redirect("/admin/products");
    }
  });
});
app.get("/updateproduct/:productId", (req, res) => {
  const productID = req.params.productId;
  Products.findById(productID, (err, product) => {
    if (!err) {
      res.render("admin/Updateproduct", { product: product });
    }
  });
});
app.post("/updateproduct", (req, res) => {
  console.log(req.body);
  const productId = req.body.submit;
  Products.findByIdAndUpdate(productId, {
    $set: {
      productName: req.body.productName,
      image: "man.jpg",
      quantity: req.body.quantity,
      pricePerProduct: req.body.pricePerProduct,
      promotion: (req.body.promotion/100),
      category: req.body.category,
      instockAt: getDate(),
      detail: req.body.detail
    }
  }, (err) => {
    if (!err) {
      res.redirect("/admin/products");
    }
  });
});

//!DOING WITH CLIENT SIDE
//TODO: all products, promotions, features are loaded from database, add product to cart, purchase product
const discount = {
  normalprice: "text-decoration: line-through red 2px;",
  discountprice: "display: inline;",
};
const normal = {
  normalprice: "text-decoration: none;",
  discountprice: "display: none;",
};

app.get("/", (req, res) => {
    Products.find({}, (err,product)=>{
      res.render("index", {
        username: "login",
        products: product,
        cartNumber: 0,
        userId: "1234"
      });
    });
});
app.get("/user/:id",(req,res)=>{
  if(req.isAuthenticated()){
    User.findById(req.params.id,(err,user)=>{
      if(!err){
        Products.find({}, (err,product)=>{
          res.render("index", {
            username: "logout",
            products: product,
            cartNumber: user.carts.length,
            userId: req.params.id
          });
        });
      }
    });
  }else{
    res.redirect("/");
  }
});

app.get("/quickview/:productId", (req, res) => {
  const proID = req.params.productId;
  if(req.isAuthenticated()){
    Products.findById(proID, (err,product)=>{
      res.render("quickview", {
        username: "logout",
        product: product,
        cartNumber: 0,
        userId: 1234
      });
    });
  }else{
    Products.findById(proID, (err,product)=>{
      res.render("quickview", {
        username: "login",
        product: product,
        cartNumber: 0,
        userId: 1234
      });
    });
  }
});
function sumPrice(datas) {
  var sum = 0;
  datas.forEach((data) => {
    sum += data.totalprice;
  });
  return sum;
}
app.get("/shoppingcart/:userId", (req, res) => {
  if(req.isAuthenticated()){
    User.findById(req.params.userId,(err,user)=>{
      if(!err){
        Products.find({}, "_id productName", (er, product) => {
          res.render("shoppingCart", {
            cart: user.carts,
            product: product,
            username: "logout",
            cartNumber: 0,
            userId: req.params.userId,
            total: sumPrice(user.carts),
          });
        });
      }
    });
  }else{
    res.redirect("/");
  }
});
app.post("/addcart", (req, res) => {
  console.log(req.user);
  if(req.user === undefined){
    res.redirect("/login");
  }else{
    User.findById(req.user._id,(err,user)=>{
      if(err){
        console.log(err);
      }else{
        if(user){
          Products.findById(req.body.productId, (err, product) => {
            if(!err){
              user.carts.push({
                productId: req.body.productId,
                newQuantity: req.body.quantity,
                totalprice: product.pricePerProduct * product.promotion * req.body.quantity
              });
              user.save(()=>{
                res.redirect("/user/"+req.user._id);
              });
            }
          });
        }
      }
    });
  }
});
app.post("/purchase",(req,res)=>{
  User.findById(req.user._id,(err,user)=>{
    if(!err){
      user.carts.forEach(cart=>{
        Products.findById(cart.productId,(err,product)=>{
          user.purchase.push({
            products: [product],
            shippingCountry: req.body.shippingCountry,
            shippingCity: req.body.shippingCity,
            shippingContact: req.body.shippingContact
          });
          user.save(()=>{
            user.carts.shift();
            user.save();
          });
        });
      });
      res.redirect("/user/"+req.user._id);
    }
  });
});
//TODO:
//Register
//User Login on landing page can comment, purchase, and view history order
app.get("/register", (req, res) => {
  res.render("register", { wrong: "Please fill in this form to create an account.", styles: "" });
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function (req, res) {
  if (req.body.password != req.body.passportRepeat) {
    const message = "Password Not Match";
    res.render("register", { wrong: message, styles: "red" });
  } else if (req.body.password.length < 3) {
    const message = "Password less than 3";
    res.render("register", { wrong: message, styles: "red" });
  } else {
    User.register(
      {
        username: req.body.username,
        name: req.body.name,
      },
      req.body.password,
      function (err, user) {
        if (err) {
          console.log(err);
          const message = "Email is already register";
          res.render("register", { wrong: message, styles: "red" });
        } else {
          passport.authenticate("local")(req, res, function () {
            res.redirect("/");
          });
        }
      }
    );
  }
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/user/"+req.user._id);
      });
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
