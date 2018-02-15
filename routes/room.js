var express = require('express')

var mongoose = require("mongoose");
var Users = require('../models/user');
var Rooms = require('../models/room');

var bodyParser = require('body-parser');

var router = express.Router();

router.use(bodyParser.json());


router.post('/publish', function(req, res){
    // Vérification du token 
    var token = req.headers.authorization;   // Récupération du token dans le headers
    if (token !== undefined){
        token = token.replace("Bearer", "").trim(); // Le token est récuperer avec le mot bearer il faut donc isolé le token
        Users.findOne({ token: token }).exec(function(err, user){   // Recherche de user ayant ce token
            
            if (!err){
                if (!user){         // Gestion des erreurs si aucun user, retourne un tableau vide
                    res.status(401).json({
                        "error": {
                          "code": 9473248,
                          "message": "Invalid token"
                        }
                    })
                }
                else{
                    console.log("isAuthenticated"); // Dans ce cas il existe
                    var title = req.body.title;
                    var description = req.body.description;
                    var price = req.body.price;
                    var city = req.body.city;
                    var loc = req.body.loc;
                    var photos = req.body.photos;
                    var reviews = req.body.reviews;
                    var ratingValue = req.body.ratingValue;

                    var room = {
                        title,
                        description,
                        price,
                        city,
                        loc,
                        ratingValue,
                        reviews,
                        photos,
                        user : user
                    }
                    var newRoom = new Rooms(room);
                    //console.log("Affichage du room "+newRoom)
                    newRoom.save(function(err, room){
                        if (err) return err
                        console.log("saved")
                        var id = room._id;
                        Rooms.findById(id).populate("user", 'account.username').exec(function (err, room) {
                            if (err) return err
                            user.rooms.push(room);
                            user.save()
                            //console.log(user) 
                            res.json(room)
                        });
                    });                  
                }
            }
        })
    }
    else{
        res.status(401).json({
            "error": {
              "code": 48326,
              "message": "Invalid token"     // ce message s'affiche quand il n'y a aucun token dans la validation du compte
            }
        })
    }
  
})

router.get("/")

router.get("/search", function(req, res){
    var longitude = req.query.longitude;
    var latitude = req.query.latitude;
    var distance = req.query.distance;
    
    function getRadians(meters) {
        var km = meters / 1000;
        return km / 111.2;
      }
      
      Rooms.find()
        .where("loc")
        .near({
          center: [longitude, latitude],
          maxDistance: getRadians(distance) // 10 kilomètres
        })
        .exec()
        .then(function(rooms) {
          res.json(rooms);
        });
})

router.get("/:id", function(req, res){
    var id = req.params.id;

    Rooms.findById(id).populate('user', 'account.username').exec(function(err, room){
        res.json(room)
    })
})



router.get("/", function(req, res){
    var city = req.query.city;
    //var count;
    //var rooms;

    Rooms.find({city}, function(err, room){
        //rooms = room
        //console.log("liste des rooms" + room)
        Rooms.count({city}, function(err, count){
            res.json({
                "rooms" : room,
                "count" : count  
            })
        })
    });
})



module.exports = router;