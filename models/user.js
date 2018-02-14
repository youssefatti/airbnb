var mongoose = require('mongoose');
var uniqueValidator = require("mongoose-unique-validator");

var users = new mongoose.Schema(
    {
        "account": {
           "username": { // Permet de faire la validation du username afin d'evité les doublons
                    type: String,
                    required: [true, "User name is required"],
                    unique: true
        },
           "biography": String
        },
        "email": { // Permet de faire la validation de l'email afin d'evité les doublons
            type: String,
            required: [true, "User name is required"],
            unique: true
},
        "token": String,
        "hash": String,
        "salt": String,
        "activated": Boolean
    });
  
// Permet l'affichage d'un meilleur message d'erreur
users.plugin(uniqueValidator, { message: "{PATH} is already taken" });
  // 2) Definir le model - A faire qu'une fois
module.exports  = mongoose.model("Users", users);