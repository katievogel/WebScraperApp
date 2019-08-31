var artID;

$(".note-button").on("click", function(event) {
    event.preventDefault();
    artID = event.target.value;
    $("#note-modal").modal("toggle")
});

$(".note-update").on("click", function(event){
    event.preventDefault();
    var id = artID;
    console.log(id);
    var newNoteUpdate = {
        body: $("#note-text").val().trim()
    };
    $.ajax("/notes/" + id, {
        type: "PUT",
        data: newNoteUpdate
    }).then(function(){
        console.log("note has been saved to " + id);
        location.reload();
    });
});

$(".del-art").on("click", function(event){
    event.preventDefault();
    var id = event.target.value;
    $.ajax("/scrape/" + id, {
        type: "DELETE"
    }).then(function(){
        console.log("removed: " + id);
        location.reload();
    });
});