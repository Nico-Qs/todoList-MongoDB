const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
require('dotenv').config(); // Para usar variables de entorno

// Conexion y esquema de la base de datos ------------------------
const mongoose = require("mongoose");

mongoose.set('strictQuery', false); // Para evitar el error de que no se puede actualizar un documento que no existe
// Conectarse a la base de datos especificada
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Mongo connected: ${conn.connection.host}`);
  }
  catch (err) {
    console.error(err);
    process.exit(1);
  }
}

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const Item1 = new Item({
  name: "Welcome to your todolist!"
});

const Item2 = new Item({
  name: "Hit the + button to add a new item."
});

const Item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [Item1, Item2, Item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);
// ------------------------
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.post("/", function(req, res){

  const item = new Item({
    name: req.body.newItem
  })
  const listName = _.capitalize(req.body.list);
  
  if (listName === "Today"){
    item.save();
  res.redirect("/");
  }
  else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.get("/:listaCustom", function(req, res){
  const listaCustom = _.capitalize(req.params.listaCustom); // Para obtener el nombre de la lista que esta en la url
  console.log(listaCustom);

  List.findOne({name: listaCustom}, function(err, foundList){
    if (!err){
      if (!foundList){
        const list = new List({
          name: listaCustom,
          items: defaultItems
        });

        list.save(function(err,result){
          res.redirect("/" + listaCustom);
        }); // Para guardar la lista en la base de datos y redireccionar a la lista
      }
      else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
    else {
      console.log(err);
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

// Para eliminar un item

app.post("/delete",function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
      else {
        console.log(err);
      }
    });
  }
  else {
    List.findOneAndUpdate({name: listName}, {$pull: { items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
      else {
        console.log(err);
      }
    });
  }
});

connectDB.then(() => {
  app.listen(3000, function() {
    console.log("Server started on port 3000");
  });
});
