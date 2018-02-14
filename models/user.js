var mongoose = require('mongoose');

var users = new mongoose.Schema(
    {
        "account": {
           "username": String,
           "biography": String
        },
        "email": String,
        "token": String,
        "hash": String,
        "salt": String
    });
  
  // 2) Definir le model - A faire qu'une fois
module.exports  = mongoose.model("Users", users);