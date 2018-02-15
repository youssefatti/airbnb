var mongoose = require('mongoose');

var room = new mongoose.Schema({
        "title": String,
        "description": String,
        "photos": [String],
        "price": Number,
        "ratingValue": Number,
        "reviews": Number,
        "city": String,
        "loc": {
            "type": [Number], // Longitude et latitude
            "index": "2d" // Créer un index geospatial https://docs.mongodb.com/manual/core/2d/
            },
        "user": {
            "type": mongoose.Schema.Types.ObjectId,
            "ref": "Users"
            }
    });
  

    // 2) Definir le model - A faire qu'une fois
module.exports  = mongoose.model("Rooms", room);