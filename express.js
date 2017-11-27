var express=require('express'),
mysql=require('mysql'),
credentials=require('./credentials.json'),
app = express(),
port = process.env.PORT || 1337;

credentials.host='ids.morris.umn.edu'; //setup database credentials

var connection = mysql.createConnection(credentials); // setup the connection
var loggedIn = false;

connection.connect(function(err){
  if(err){
    console.log(error)
  }
});

app.use(express.static(__dirname + '/public'));
app.get("/buttons",function(req,res){
  var sql = 'SELECT * FROM sixel004.till_buttons';
  connection.query(sql, (function(res){return function(err,rows,fields){
     if(err){console.log("Houston we have a problem: ");
             console.log(err);}
     res.send(rows);
  }})(res));
});

app.get("/current/:user",function(req,res){
  var user = req.params.user;
  var sql = "SELECT inventory.item, current_transaction.quantity, prices.price, current_transaction.invID from sixel004.inventory, sixel004.current_transaction, sixel004.prices where (inventory.id = current_transaction.invID AND inventory.id=prices.id AND current_transaction.user = '" + user + "')";
  connection.query(sql, (function(res){
    return function(err,rows,fields){
     if(err){console.log("Houston we have a problem: ");
             console.log(err);}
     res.send(rows);
  }})(res));
});

app.get("/login/:user/:pass", function(req,res){
  var resp = {};
  var user = req.params.user;
  var pass = req.params.pass;
  var sql = "SELECT * FROM sixel004.users WHERE user = '" + user + "'";
  console.log("Attempting sql ->" + sql + "<-");

  connection.query(sql, (function(res){
    return function(err,rows,fields){
     if(err){
       resp.err = err;
       console.log("Houston we have a problem (again): ");
       console.log(err);
     }
     resp.correct = rows[0].password == pass;
     res.send(resp);
  }})(res));
});

app.get("/click/:id/:user",function(req,res){
  var resp = {};
  var id = req.params.id;
  var user = req.params.user;
  var sql = 'INSERT INTO sixel004.current_transaction (invID, quantity, startTime, stopTime, user) VALUES ( ' + id + ', 1, NOW(), NOW(), "' + user + '") ON DUPLICATE KEY UPDATE invID = ' + id + ', quantity = quantity+1, stopTime = NOW()';
  console.log("Attempting sql ->" + sql + "<-");

  connection.query(sql, (function(res){
    return function(err,rows,fields){
     if(err){
       resp.err = err;
       console.log("Houston we have a problem (again): ");
       console.log(err);
     }
     res.send(err);
  }})(res));
});

app.get("/submit/:user/:total/",function(req,res){
  var resp = {};
  var user = req.params.user;
  var total = req.params.total;
  console.log("Oh dear you've hit submit");
  //var sql = 'INSERT INTO sixel004.archived_transactions (invID, quantity, startTime, stopTime, user, transactionID, total_prices) SELECT *, (SELECT MAX(transactionID)+1 from sixel004.archived_transactions) AS transactionID FROM sixel004.current_transaction WHERE current_transaction.user = \'' + user + '\'';
  var sql = 'INSERT INTO sixel004.archived_transactions (invID, quantity, startTime, stopTime, user, transactionID, total_prices) SELECT *, (SELECT MAX(transactionID)+1 from sixel004.archived_transactions), ' + total + ' AS transactionID FROM sixel004.current_transaction WHERE current_transaction.user = \'' + user + '\'; create or replace view transactionSummary as select transactionID, Min(startTime) as startTime, Max(stopTime) as stopTime, TIMESTAMPDIFF(second, Min(startTime), Max(stopTime)) as duration, user, total_prices from archived_transactions group by transactionID; ';
  console.log("Attempting sql ->" + sql + "<-");

  connection.query(sql, (function(res){
    return function(err,rows,fields){
     if(err){
       resp.err = err;
       console.log("Houston we have a problem (again): ");
       console.log(err);
     }
     res.send(err);
  }})(res));
});

app.get("/changeOne/:id/:quantity", function(req,res){
  var resp = {};
  // console.log(req);
  var id = req.params.id;
  var quantity = req.params.quantity;
  resp.quantity = quantity;
  console.log("The ID is " + id + " and the quantity to add is " + quantity);
  var sql = 'Update sixel004.current_transaction set quantity = (quantity + ' + quantity + ') where invID = ' + id;
  console.log("Attempting sql ->" + sql + "<-");

  connection.query(sql, (function(res){
    return function(err,rows,fields){
     if(err){
       resp.err = err;
       console.log("Houston we have a problem (again): ");
       console.log(err);
     }
     res.send(resp);
  }})(res));
});

app.get("/removeItem/:id", function(req,res){
  var resp = {};
  resp.message = "Testing things in resp";
  var id = req.params.id;
  var sql = 'DELETE FROM sixel004.current_transaction where invID = ' + id;
  console.log("Attempting sql ->" + sql + "<-");

  connection.query(sql,(function(res){
    return function(err,rows,fields){
     if(err){
       resp.err = err;
       console.log("Houston we have a problem (again): ");
       console.log(err);
     }
     res.send(resp);
  }})(res));
});

app.get("/truncate/:user", function(req,res){
  var user = req.params.user;
  console.log(user);
  var sql = 'DELETE FROM sixel004.current_transaction WHERE user = "' + user + '"';
  console.log("Attempting sql ->" + sql + "<-");

  connection.query(sql,(function(res){
    return function(err,rows,fields){
     if(err){
       resp.err = err;
       console.log("Houston we have a problem (again): ");
       console.log(err);
     }
     res.send(err); // Let the upstream guy know how it went
  }})(res));
});


// Your other API handlers go here!

app.listen(port);

console.log("Server started on localhost:"+port);
