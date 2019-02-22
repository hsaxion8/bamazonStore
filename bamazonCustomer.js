var mysql = require('mysql');
var inquirer = require('inquirer');
var connection = require('./connect.js');

function continueShopping() {
  inquirer.prompt([{
    type: 'confirm',
    message: '\nWould you like to place another order?\n',
    name: 'continue'
  },]).then(function (value) {
    if (value.continue !== true) {
      return connection.end();
    }
    return getProductList();
  }).catch(function (error) {
    throw error;
  });
};

function completeOrder(item, amount) {
  var netCost = parseFloat(item.price) * parseInt(amount);
  var totalCost = parseFloat(netCost + (netCost * 0.07)).toFixed(2);
  var netStock = item.stock_quantity - amount;
  var totalSales = parseFloat(item.product_sales + netCost).toFixed(2);
  inquirer.prompt([{
    type: 'confirm',
    message: '\nPlace order for ' + amount + ' of ' + item.product_name + ' at total price of $' + totalCost + ' (including 7% tax).\n',
    name: 'placeOrder'
  },]).then(function (value) {
    if (value.placeOrder !== true) {
      console.log('\nOrder cancelled.\n');
      return continueShopping();
    }
    console.log('\nOrder confirmed. Your card will be charged $' + totalCost + '.\n');
    var stockUpdate = [{
      stock_quantity: netStock
    }, {
      item_id: item.item_id
    }];
    var salesUpdate = [{
      product_sales: totalSales
    }, {
      item_id: item.item_id
    }];
    connection.query('UPDATE products SET ? WHERE ?', stockUpdate, function (error) {
      if (error) throw error;
    });
    connection.query('UPDATE products SET ? WHERE ?', salesUpdate, function (error) {
      if (error) throw error;
    });
    continueShopping();
  }).catch(function (error) {
    throw error;
  });
};

function promptQuantity(item, question) {
  inquirer.prompt([{
    type: 'input',
    message: question,
    name: 'amount',
    validate: function (value) {
      if (isNaN(value) === false) {
        if (value <= item.stock_quantity) {
          return true;
        }
        console.log('\nSorry. There is not enough ' + item.product_name + ' to fulfill your order.\n' +
          'Change order to ' + item.stock_quantity + ' or less.\n');
        return false;
      }
      return false;
    },
  },]).then(function (response) {
    completeOrder(item, response.amount);
  }).catch(function (error) {
    throw error;
  });
};

function itemTypeMessage(item) {
  var question;
  switch (item.department_name) {
    default:
      question = 'How many units of ' + item.product_name + ' would you like to order?';
  };
  promptQuantity(item, question);
};

function queryCustomer(data) {
  inquirer.prompt([{
    type: 'list',
    message: 'Select item you would like to order from list below\n',
    choices: function () {
      var choiceArr = [];
      for (i = 0; i < data.length; i++) {
        choiceArr.push(data[i].item_id + " : " + data[i].department_name + " : " + data[i].product_name);
      }
      return choiceArr;
    },
    name: 'itemList',
  },]).then(function (input) {
    var idArr = input.itemList.split(" : ");
    var selectedItem;
    for (i = 0; i < data.length; i++) {
      if (parseInt(idArr[0]) === parseInt(data[i].item_id)) {
        selectedItem = data[i];
      }
    }
    itemTypeMessage(selectedItem);
  }).catch(function (error) {
    throw error;
  });
};

function getProductList() {
  var sqlQuery = 'SELECT * FROM products';
  connection.query(sqlQuery, function (error, data) {
    if (error) throw error;
    queryCustomer(data);
  })
};

connection.connect(function (error) {
  if (error) throw error;
  console.log('Connected as id: ' + connection.threadId);
  getProductList();
});