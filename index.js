var express = require('express')
var app = express();
var mongoose = require("mongoose");
var Users = require('./models/user');
var SHA256 = require("crypto-js/sha256");
var encBase64 = require("crypto-js/enc-base64");
var uid = require("uid2");
var bodyParser = require('body-parser')

mongoose.connect('mongodb://localhost:27017/airbnb');

app.use(bodyParser.json())
//"Content-Type": "application/json" 

var mailgun = require("mailgun-js");
var api_key = 'key-20f1eb398afded65a8f1e4341e400f4a';
var DOMAIN = 'sandboxa142765faced4725b05ca70454741094.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: DOMAIN});
 
app.post('/api/user/sign_up', function (req, res) {
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
                console.log("something went wrong");
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
        text: 'Testing some Mailgun awesomness!'+ ' ' + 'http://localhost:3000/api/user/validation/'+ user.token,
        };
        
        mailgun.messages().send(data, function (error, body) {
            // console.log("send")
            // console.log(data.text)
            // console.log(body);
        });
});   

app.get("/api/user/validation/:token", function(req, res){
    
    var token = req.params.token;
    Users.findOneAndUpdate({token : token}, { activated : true, token : uid(32)}, {new: true}, function(err, user){
        console.log("affiche le user "+user)
        var data = {
            from: 'airbnb <me@samples.mailgun.org>',
            to: user.email,
            subject: 'Votre compte est validé',
            text: 'Bravo compte valide',
            };
            
            mailgun.messages().send(data, function (error, body) {
                // console.log("send")
                // console.log(data.text)
                // console.log(body);
            });
        res.json(user);
        // user.update({ activated : true}, {token : uid(32)}, function(err, userUpdate){

        //     console.log("user update "+userUpdate)
        // })
        
        // user.set({
        //     activated : true,
        //     token : uid(32)
        // })
        // user.save(function(err, userUpdate){
        //     console.log("user update "+userUpdate)
        // })
    })
    
});

app.get("/api/user/:id", function(req, res){
    var id = req.params.id;
    var token = req.headers.authorization;
    if (token !== undefined){
        token = token.replace("Bearer", "").trim();
        Users.find({ token: token }, function(err, user){ 
            if (!err){
                if (0 === user.length){
                    res.status(401).json({
                        "error": {
                          "code": 9473248,
                          "message": "Invalid token"
                        }
                    })
                }
                else{
                   // if(token == user[0].token){
                        console.log("isAuthenticated");
                        Users.findById({ _id : id}, function(err, user){
                            var userResponse = {
                                _id: user._id,
                                account: {
                                username: user.account.username,
                                biography: user.account.biography
                                }
                            }
                            res.json(userResponse);
                        })
                   // }
                }
            }
        })
    }
    else{
        res.status(401).json({
            "error": {
              "code": 48326,
              "message": "Invalid token"
            }
        })
    }
})

// Connexion avec l'email ou le username

app.post("/api/user/log_in", function(req, res){
    var input = req.body.input;
    var password = req.body.password;

    var itsEmail = input.search("@");

    console.log(itsEmail+" test")

    if (itsEmail !== -1){
        console.log("its a email")
        email = input;
        Users.find({ email: email }, function(err, user){
            if (err) {
                console.log("something went wrong");
            } 
            else {
                var salt = user[0].salt;
                var hash = SHA256(password+salt).toString(encBase64);
         
                if (hash == user[0].hash){
                    console.log("is authenticated")
                    var userResponse = {
                        _id: user[0]._id,
                        token: user[0].token,
                        account: {
                        username: user[0].account.username,
                        biography: user[0].account.biography
                        }
                    }
                    res.json(userResponse);
                }
                else{
                    res.json("Unauthorized");
                }
            }
        })
    }
    else if (itsEmail === -1){
        username = input;//.toLowerCase();
        Users.find( { "account.username" : username}, function(err, user){
            if (err) {
                console.log("something went wrong");
            } 
            else {
                var salt = user[0].salt;
                var hash = SHA256(password+salt).toString(encBase64);
         
                if (hash == user[0].hash){
                    console.log("is authenticated")
                    var userResponse = {
                        _id: user[0]._id,
                        token: user[0].token,
                        account: {
                        username: user[0].account.username,
                        biography: user[0].account.biography
                        }
                    }

                    res.json(userResponse);
                }
                else{
                    res.json("Unauthorized");
                }
            }
        })
    }
    else{
        res.json("Erreur dans le champs input");
    }
})

app.get("*", function(req, res){
    res.status(404).send("Erreur de connection")
})

app.listen(3000, function(){
      console.log("server is connected")
});

// connexion avec seulement l'email

// app.post("/api/user/log_in", function(req, res){
//     var email = req.body.email;
//     var password = req.body.password;
//     //console.log("email " + email + " password " + password)



//     Users.find({ email: email }, function(err, user){
//         if (err) {
//             console.log("something went wrong");
//         } 
//         else {
//             console.log(user)
//             var salt = user[0].salt;
//             var hash = SHA256(password+salt).toString(encBase64);
     
//             if (hash == user[0].hash){

//                 console.log("is authenticated")

//                 var userResponse = {
//                     _id: user[0]._id,
//                     token: user[0].token,
//                     account: {
//                     username: user[0].account.username,
//                     biography: user[0].account.biography
//                     }
//                 }
//                 res.json(userResponse);
//             } 
//         }
//     })
// })
