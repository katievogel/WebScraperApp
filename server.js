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

app.get("/", function (req, res) {
    console.log("initial page load works");
    var articlesCursor = connection.db.collection('articles').find({});
    //articlesCursor.forEach(console.log);
    articlesCursor.toArray().then(function (articles) {
        var hbsParams = {
            articles: articles
        };
        res.render("index", hbsParams);
    })
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
            console.log(result)
        });

        // 2.
        var promises = []
        for (var i = 0; i < results.length; i++){
            var result = results[i];
            var p = db.Article.updateOne({ link: result.link }, result, {upsert: true});
            promises.push(p);
        }
        
        // 3.
        var finishedResult = Promise.all(promises);
        finishedResult.then(function (objectsUpdated) {  
            var articlesCursor = connection.db.collection('articles').find({});
            var articles = articlesCursor.toArray().then(function (articles) {
                console.log("final list of articles" + JSON.stringify(articles));
                res.render("index", { articles: articles});
            });
        })

    }).catch(function (err) {
        res.json(err);
    });

});

app.put("/notes/:id", function (req, res) {
    console.log(req.body);
    db.Article.findOneAndUpdate({ _id: req.params.id }, { note: req.body.body }, { new: true }).then(function (dbArticle) {
        console.log("dbArticle:" + dbArticle);
        res.json(dbArticle);
    }).catch(function (err) {
        res.json(err);
    });
});

app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});