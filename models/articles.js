var mongoose = require("mongoose");
mongoose.set('useCreateIndex', true);

var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
    title: {
        type: String,
        required: true
    },

    link: {
        type: String,
        unique: true,
        index: true,
        required: true
    },

    note: {
        type: String,
        required: false
    }
});

var Article = mongoose.model("articles", ArticleSchema);

module.exports = Article;