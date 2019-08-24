var express = require("express");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = 3000;

var app = express();

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static("public"));

app.get("/scrape", function (req, res){
    console.log("app.get to scrape is working");
    axios.get("https://old.reddit.com/r/aww/").then(function(response){
        //I set this as 'ch' instead of '$' so I wouldn't confuse it with jquery.
        var ch = cheerio.load(response.data);
        var results = [];
        ch("p.title").each(function(i, element) {
            var result = {};
            result.title = ch(this).children("a").text();
            result.link = ch(this).children("a").attr("href");
            console.log(result);
            results.push(result);
        })
        
    })
    
})

app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });