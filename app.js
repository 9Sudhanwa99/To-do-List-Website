require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//connect to a new MongoDB server

mongoose.connect(
  "mongodb+srv://user:advaith@cluster0.3vwq6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
);

//create a new Schema

const itemsSchema = new mongoose.Schema({
  name: String,
});

// create a new model

const Item = new mongoose.model("Item", itemsSchema);

//create default documents
const item1 = new Item({
  name: "Welcome to your todo list.",
});
const item2 = new Item({
  name: "Hit the + button to add a new item",
});
const item3 = new Item({
  name: "Check the box to delete an item",
});

// array with default items
const defaultItems = [item1, item2, item3];

//list Schema

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

// list Model

const List = new mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  //finds all items, and logs them into the console when the home page is accessed. foundItems is the name of the result {} (all items)
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      //inserts default items into array if the current to do List is empty

      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB");
        }
      });

      // redirects to home page so it is displayed
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

//creates dynamic route paths for different types of lists

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // Creates a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        //saves and redirects to created list

        list.save();
        res.redirect("/" + customListName);
      } else {
        // shows an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  //finds the new item passed into the list
  const itemName = req.body.newItem;

  //finds the list the item is being updated to
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  //conditional statement controlling to which list the item is updated to

  if (listName === "Today") {
    //saves item into database, redirects to home rout and renders it on the screen
    item.save();
    res.redirect("/");
  } else {
    //finds custom list and adds new item to it
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//deletes tasks already done
//checks their _id, stores it in the const checkedItemId and removes the object
//The page is then immediately redirected to the home route

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Item successfully deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server is running");
});
