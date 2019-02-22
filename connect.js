var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'notlimah',
  database: 'bamazon'
});

module.exports = connection;