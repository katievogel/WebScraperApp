var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var NotesSchema = new Schema({
    title: String, 
    body: String
});

var Note = mongoose.model("notes", NotesSchema);

module.exports = Note;