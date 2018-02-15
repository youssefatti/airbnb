var express = require('express')

var router = express.Router();

router.get("*", function(req, res){                    // Dans le cas d'un lien vers une page inexistante
    res.status(404).send("Page inexistante")
})

module.exports = router;