var express = require('express')

var mongoose = require("mongoose");
var Users = require('../models/user');
var SHA256 = require("crypto-js/sha256");
var encBase64 = require("crypto-js/enc-base64");
var uid = require("uid2");
var bodyParser = require('body-parser')

var router = express.Router();

router.use(bodyParser.json())

// Configuration de mailgun

var mailgun = require("mailgun-js");
var api_key = 'key-20f1eb398afded65a8f1e4341e400f4a';
var DOMAIN = 'sandboxa142765faced4725b05ca70454741094.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: DOMAIN});

// Création du compte

router.post('/sign_up', function (req, res) {
    //console.log(req + " de req");
    var username = req.body.username;//.toLowerCase();
    var email = req.body.email;
    var password = req.body.password;
    var biography = req.body.biography;
    var salt = uid(64);
    var hash = SHA256(password+salt).toString(encBase64);
    var token = uid(32);
    
    var user = {
        account: {
            username: username,
            biography: biography
         },
        email: email,
        token: token,
        hash: hash,
        salt: salt,
        activated: false
        }

    var newUser = new Users(user);
        newUser.save(function(err, user) {
            
            if (err) {
                //console.log("something went wrong");
                res.send(err);
            } 
            else {
                var userResponse = {
                    _id: user._id,
                    token: user.token,
                    account: {
                    username: user.account.username,
                    biography: user.account.biography
                    }
                }
                res.json(userResponse)
            }
        })

    var data = {
        from: 'airbnb validation <me@samples.mailgun.org>',
        to: user.email,
        subject: 'Validez votre compte',
        text: 'Testing some Mailgun awesomness!'+ ' ' + 'http://localhost:3000/validation/'+ user.token,
        };
        
        mailgun.messages().send(data, function (error, body) {
        });
});   

// Validation de la creation du compte par mail

router.get("/validation/:token", function(req, res){
    // voir dans le cas ou le token n'existe pas

    var token = req.params.token;
    // Recherche du token sans activation
    Users.findOneAndUpdate({token : token, activated : false}, { activated : true, token : uid(32)}, {new: true}, function(err, user){
        if(!err){
            if(user!= null){ // si le token existe et que le compte n'est pas activé alors on envoi le mail
                var data = {
                        from: 'airbnb <me@samples.mailgun.org>',
                        to: user.email,
                        subject: 'Votre compte est validé',
                        text: 'Bravo compte valide',
                    };
        
                    mailgun.messages().send(data, function (error, body) {
                    });
                res.json(user);
            }
            else{
                console.log("Compte déja activé")// Votre compte est déja activé
                res.json({
                    "error": {
                      "code": 94,
                      "message": "Compte déjà activé"
                    }
                })
            }
        }
        else{
            console.log(err)
            res.json(err)
        }
    })
});

// Acces a une fiche avec l'id 

router.get("/:id", function(req, res){
    var id = req.params.id;
    var token = req.headers.authorization;   // Récupération du token dans le headers
    if (token !== undefined){
        token = token.replace("Bearer", "").trim(); // Le token est récuperer avec le mot bearer il faut donc isolé le token
        Users.find({ token: token }, function(err, user){   // Recherche de user ayant ce token
            if (!err){
                if (0 === user.length){         // Gestion des erreurs si aucun user, retourne un tableau vide
                    res.status(401).json({
                        "error": {
                          "code": 9473248,
                          "message": "Invalid token"
                        }
                    })
                }
                else{
                    console.log("isAuthenticated"); // Dans ce cas il existe
                    Users.findById({ _id : id}, function(err, user){ // alors on cherche la fiche demandé par le user du token
                        var userResponse = {
                            _id: user._id,
                            account: {
                            username: user.account.username,
                            biography: user.account.biography
                            }
                        }
                        res.json(userResponse);  // on retourne la fiche du user demandé par le token
                    })
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

// Connexion avec l'email ou le username 

router.post("/log_in", function(req, res){
    var input = req.body.input; // récupération de l'input, soit email soit username
    var password = req.body.password;

    var itsEmail = input.search("@"); // Permert de savoir si c'est un email ou un username

    if (itsEmail !== -1){ // Dans ce cas c'est un email
        //console.log("its a email")
        email = input;
        Users.find({ email: email }, function(err, user){ // Recherche user avec email
            if (err) {
                console.log("something went wrong");
            } 
            else {
                var salt = user[0].salt;                // Récupération du salt enregistré dans la fiche user
                var hash = SHA256(password+salt).toString(encBase64);   // transformation du mot de mot afin d'effactuer la comparaison
         
                if (hash == user[0].hash){      // Vérification du mot de passe 
                    console.log("is authenticated")
                    var userResponse = {        // Récupération du user concerné
                        _id: user[0]._id,
                        token: user[0].token,
                        account: {
                        username: user[0].account.username,
                        biography: user[0].account.biography
                        }
                    }
                    res.json(userResponse);         // Renvoi du user concerné au format JSON
                }
                else{
                    res.json("Unauthorized");      // Dans le cas ou le mot de n'est pas correct
                }
            }
        })
    }
    else if (itsEmail === -1){       // Dans ce cas c'est un username
        username = input;
        Users.find( { "account.username" : username}, function(err, user){      //Recherche user avec username
            if (err) {
                console.log("something went wrong");
            } 
            else {
                var salt = user[0].salt;                    // Récupération du salt enregistré dans la fiche user
                var hash = SHA256(password+salt).toString(encBase64);   // transformation du mot de mot afin d'effactuer la comparaison
         
                if (hash == user[0].hash){          // Vérification du mot de passe
                    console.log("is authenticated")
                    var userResponse = {            // Récupération du user concerné
                        _id: user[0]._id,
                        token: user[0].token,
                        account: {
                        username: user[0].account.username,
                        biography: user[0].account.biography
                        }
                    }

                    res.json(userResponse);         // Renvoi du user concerné au format JSON
                }
                else{
                    res.json("Unauthorized");       // Dans le cas ou le mot de n'est pas correct
                }
            }
        })
    }
    else{
        res.json("Erreur dans le champs input");    // Erreur dans le champs input
    }
})



// Modification d'une fiche client

// router.get("/edit/:id", function(req, res){
//     var id = req.params.id;
//     Users.findById(id, function(err, user){
//         if(!err){

//         }
//     })
// })
module.exports = router;