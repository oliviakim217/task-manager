const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Create DB - CHANGE LATER
mongoose.connect("mongodb://localhost:27017/todolistDB");

// Create a itemsSchema & items collection
const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome To My To-do List!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

// Create a listSchema & lists collection
const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


// Root Route
app.get("/", function(req, res) {
    Item.find({}, function(err, foundItems){
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err){
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully inserted default items.")
                }
            });
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    });
 });

 // Other Routes (Users can create custom lists)
app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, function(err, foundList){
        if (!err) {
            if (!foundList){
                // Create a new list
                const list = new List ({
                    name: customListName,
                    items: defaultItems 
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                // Show an existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }   
    });
});

// Add a new item
app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list; // e.g. 'work'

    // Create a new document
    const inputItem = new Item ({
        name: itemName
    });

    if (listName === "Today") { // Add the new item to a default list
        inputItem.save();
        res.redirect("/");
    } else { // Add a new item to a custom list
        List.findOne({name: listName}, function(err, foundList) {
            if (!err) {
                foundList.items.push(inputItem);
                foundList.save();
                res.redirect("/" + listName);
            };
        });
    }
});

// Delete an item
app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName; //e.g. 'home'

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err){
            if (err) {
                console.log(err);
            } else {
                console.log("Successfully removed the item.");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }

    
});



app.listen(3000, function () {
    console.log("Server started on port 3000.")
})