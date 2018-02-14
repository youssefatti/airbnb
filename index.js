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

app.post('/api/user/sign_up', function (req, res) {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var biography = req.body.biography;
    var salt = uid(64);
    var hash = SHA256(password+salt).toString(encBase64);
    var token = uid(10);
    
    var user = {
        account: {
            username: username,
            biography: biography
         },
        email: email,
        token: token,
        hash: hash,
        salt: salt  
        }

console.log(user)
    var newUser = new Users(user);
        newUser.save(function(err, user) {
            if (err) {
            console.log("something went wrong");
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
});   


app.post("/api/user/log_in", function(req, res){
    var email = req.body.email;
    var password = req.body.password;
    console.log("email " + email + " password " + password)
    Users.find({ email: email }, function(err, user){
        if (err) {
            console.log("something went wrong");
        } 
        else {
            console.log(user)
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
        }
    })
})

app.get("/api/user/:id", function(req, res){
    var id = req.params.id;

    if (token != ''){
        var token = req.headers.authorization;

        token = token.replace("Bearer", "").trim();

        Users.find({ token: token }, function(err, user){
            if (!err){
                if(token == user[0].token){
                    console.log("isAuthenticated");
                    Users.findById({ _id : id}, function(err, user){
                        var userResponse = {
                            _id: user._id,
                            account: {
                            username: user.account.username,
                            biography: user.account.biography
                            }
                        }
                        console.log(userResponse)
                        res.json(userResponse);
                    })
                }
                else{
                    console.log("Unauthorized")
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


function isAuthenticated(token){
    Users.find({ token: token }, function(err, res){
        if (!err){
            if(token == user[0].token){
                console.log("isAuthenticated");
                return true;
            }
            else{
                console.log("Unauthorized")
                return false;
            }
        }
    })
}

app.listen(3000, function(){
      console.log("server is connected")
});
