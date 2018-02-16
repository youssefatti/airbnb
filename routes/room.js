var express = require("express");

var mongoose = require("mongoose");
var Users = require("../models/user");
var Rooms = require("../models/room");

// Permet de pouvoir récuperer les données en body params ou query ??? a confirmer
var bodyParser = require("body-parser");

var router = express.Router();

var limit = 2;
//var skip = 2;
//var currentPage = 1;

router.use(bodyParser.json());

// Mise en ligne d'une nouvelle room

router.post("/publish", function(req, res) {
  // Vérification du token
  var token = req.headers.authorization; // Récupération du token dans le headers
  if (token !== undefined) {
    token = token.replace("Bearer", "").trim(); // Le token est récuperer avec le mot bearer il faut donc isolé le token
    Users.findOne({ token: token }).exec(function(err, user) {
      // Recherche de user ayant ce token

      if (!err) {
        // Si il n'y a pas d'erreur on continue
        if (!user) {
          // Gestion des erreurs si aucun user, retourne un tableau vide
          res.status(401).json({
            error: {
              code: 9473248,
              message: "Invalid token"
            }
          });
        } else {
          console.log("isAuthenticated"); // Dans ce cas le user existe
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
            user: user
          };
          // Ajout de room a notre schema
          var newRoom = new Rooms(room);
          //console.log("Affichage du room "+newRoom)
          // Enregistrement de la nouvelle room
          newRoom.save(function(err, room) {
            if (err) return err; // Si il y a une erreur on la retourne
            // console.log("saved");
            // Récupération de l'id de la room afin de update avec les info du user
            var id = room._id;
            Rooms.findById(id)
              .populate("user", "account.username") // Permet l'ajout des infos du user et fait la mise en relation entre le user et la room
              .exec(function(err, room) {
                if (err) return err; // Si il y a une erreur on la retourne
                //console.log("user : ", user);
                user.rooms.push(room);
                user.save();
                //console.log(user);
                res.json(room);
              });
          });
        }
      }
    });
  } else {
    res.status(401).json({
      error: {
        code: 48326,
        message: "Invalid token" // ce message s'affiche quand il n'y a aucun token dans la validation du compte
      }
    });
  }
});

// // Filtre par prix

// router.get("/filtre", function(req, res) {
//   // Récupération des prix min et max en query
//   var priceMin = req.query.priceMin;
//   var priceMax = req.query.priceMax;

//   // Création d'un tableau afin d'y mettre toutes les annonces qui rentre dans les critères de prix
//   var averaragePrice = [];

//   Rooms.find({}).exec(function(err, rooms) {
//     // Recherche de toutes les rooms
//     if (err) return err; // Si il y a une erreur on la retourne
//     for (var i = 0; i < rooms.length; i++) {
//       // On fait un boucle afn de parcourir tout les prix
//       if (rooms[i].price >= priceMin && rooms[i].price <= priceMax) {
//         // Si le prix de la room est compris entre le min et le max alors on le met dans le tableau
//         averaragePrice.push(rooms[i]);
//       }
//     }
//     res.json(averaragePrice); // On retourne la liste des rooms correspondant aux critères
//   });
// });

// Recherche des rooms par localisation

router.get("/", function(req, res) {
  if (req.query) {
    if (req.query.longitude && req.query.latitude && req.query.distance) {
      // Récupération de la localisation dans les query
      var longitude = req.query.longitude;
      var latitude = req.query.latitude;
      var distance = req.query.distance;

      // Fonction permettant de convertir les metres en radian afin qu'il soit compatible avec mangoose

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
    }
    if (req.query.priceMin || req.query.priceMax) {
      // Récupération des prix min et max en query
      var priceMin = req.query.priceMin;
      var priceMax = req.query.priceMax;

      // Création d'un tableau afin d'y mettre toutes les annonces qui rentre dans les critères de prix
      var averaragePrice = [];

      Rooms.find({}).exec(function(err, rooms) {
        // Recherche de toutes les rooms
        if (err) return err; // Si il y a une erreur on la retourne
        for (var i = 0; i < rooms.length; i++) {
          // On fait un boucle afn de parcourir tout les prix
          if (rooms[i].price >= priceMin || rooms[i].price <= priceMax) {
            // Si le prix de la room est compris entre le min et le max alors on le met dans le tableau
            averaragePrice.push(rooms[i]);
          }
        }
        res.json(averaragePrice); // On retourne la liste des rooms correspondant aux critères
      });
    }
    if (req.query.city) {
      var city = req.query.city;

      Rooms.find({ city }, function(err, room) {
        if (err) return err;
        Rooms.count({ city }, function(err, count) {
          console.log("trie par city : ", room);
          if (err) return err;
          res.json({
            rooms: room,
            count: count
          });
        });
      });
    }
  } else {
    res.json({
      message: "No queries"
    });
  }
});

router.get("/:id", function(req, res) {
  var id = req.params.id;

  Rooms.findById(id)
    .populate("user", "account.username")
    .exec(function(err, room) {
      res.json(room);
    });
});

module.exports = router;
