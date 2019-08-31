var express = require("express");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var exphbs = require("express-handlebars");
mongoose.set('useCreateIndex', true);

var db = require("./models");

var PORT = 3000;

var app = express();

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

var connection = mongoose.connection;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

//renders main page with articles already in db, if there.
app.get("/", function (req, res) {
    console.log("initial page load works");
    var articlesCursor = connection.db.collection('articles').find({});
    //articlesCursor.forEach(console.log);
    articlesCursor.toArray().then(function (articles) {
        var hbsParams = {
            articles: articles
        };
        res.render("index", hbsParams);
    });
});

//scraping articles, putting them in the db, displaying to page if not already there. if there are none in the db, this will populate them there and display on the page. if there are some already on the page it scrape, add only the new ones to the db, and add the new ones to the page
app.post("/scrape", function (req, res) {
    console.log("app.get to scrape is working");
    axios.get("https://old.reddit.com/r/aww/").then(function (response) {
        //I set this as 'ch' instead of '$' so I wouldn't confuse it with jquery.
        var ch = cheerio.load(response.data);
        var results = [];
        ch("div.link").each(function (i, element) {
            var result = {};
            result.title = ch(this).find("p.title a").text();
            result.image = ch(this).find("a.thumbnail img").attr("src");
            result.link = ch(this).find("p.title a").attr("href");
            results.push(result);
            console.log(result)
        });

        //putting all the 'updateOne's that would occur in one array called 'promises' so you only have to have to write one promise instead of a billion .then's later on. Makes sure duplicates are avoided with the upsert
        var promises = []
        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            var p = db.Article.updateOne({ link: result.link }, result, { upsert: true });
            promises.push(p);
        };

        //all the items in the promises array being run together with the promise.all. Shows all that were updated.
        var finishedResult = Promise.all(promises);
        finishedResult.then(function (objectsUpdated) {
            var articlesCursor = connection.db.collection('articles').find({});
            var articles = articlesCursor.toArray().then(function (articles) {
                console.log("final list of articles" + JSON.stringify(articles));
                res.render("index", { articles: articles });
            });
        });
    }).catch(function (err) {
        res.json(err);
    });
});

//adds a note to the db for an article if a user creates one. Notes notes noootes!!
app.put("/notes/:id", function (req, res) {
    console.log(req.body);
    db.Article.findOneAndUpdate({ _id: req.params.id }, { note: req.body.body }, { new: true }).then(function (dbArticle) {
        console.log("dbArticle:" + dbArticle);
        res.json(dbArticle);
    }).catch(function (err) {
        res.json(err);
    });
});

app.get("/notes", function (req, res){
    db.Article.find({note: {$exists: true}}).then(function(articles){
        console.log("title, image, notes:" + JSON.stringify(articles));
        res.render("notes",
        {articles:  articles});
    });
});

app.delete("/scrape/:id", function (req, res){
    db.Article.findOneAndDelete({_id: req.params.id}).then(function(removed){
        console.log("removed article: " + JSON.stringify(removed));
        res.send();
    });
});

app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
