var express = require('express')
var app = express();
var mongoose = require("mongoose");
var Users = require('./models/user');
var SHA256 = require("crypto-js/sha256");
var encBase64 = require("crypto-js/enc-base64");
var uid = require("uid2");
var bodyParser = require('body-parser')

var userRoutes = require("./routes/user")
var coreRoutes = require("./routes/core")
var roomRoutes = require("./routes/room")

app.use("/api/user", userRoutes)
app.use("/api/room", roomRoutes)
app.use("/", coreRoutes)

mongoose.connect('mongodb://localhost:27017/airbnb');

app.use(bodyParser.json())
//"Content-Type": "application/json" 





app.listen(3000, function(){
      console.log("server is connected")
});