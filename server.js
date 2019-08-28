var express = require("express");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var exphbs = require("express-handlebars");

var db = require("./models");

var PORT = 3000;

var app = express();

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.get("/", function (req, res) {
    console.log("initial page load works");
    var hbsParams = {
        articles: [
            // {title: title,
            //  link: link}
        ]
    };
    res.render("index", hbsParams);

})
app.post("/scrape", function (req, res) {
    console.log("app.get to scrape is working");
    axios.get("https://old.reddit.com/r/aww/").then(function (response) {
        //I set this as 'ch' instead of '$' so I wouldn't confuse it with jquery.
        var ch = cheerio.load(response.data);
        var results = [];
        ch("p.title").each(function (i, element) {
            var result = {};
            result.title = ch(this).children("a").text();
            result.link = ch(this).children("a").attr("href");
            results.push(result);
        });
        db.Article.insertMany(results).then(function (dbArticle) {
            var hbsParams = {
                articles: dbArticle
            }
            console.log(dbArticle);
            res.render("index", hbsParams);
        }).catch(function (err) {
            console.log(err);
        });
        
    });
});

app.put("/notes/:id", function (req, res) {
    console.log(req.body);
    // db.Notes.findOneAndUpdate({_id: req.params.id}, {body: req.body.body}, {upsert: true, new: true, runValidators: true}).then(function (dbNotes) {
    //     console.log("dbNotes:"+ dbNotes);
    //     console.log("req.params.id:" + req.params.id);
    //     console.log("dbNotes._id:" + dbNotes._id);
    //     return 
    db.Article.findOneAndUpdate({ _id: req.params.id }, { note: req.body.body}, { new: true }).then(function (dbArticle) {
        console.log("dbArticle:" + dbArticle);
        res.json(dbArticle);
    }).catch(function (err) {
        res.json(err);
    });
});

app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});