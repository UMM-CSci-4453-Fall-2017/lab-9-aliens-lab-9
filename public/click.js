angular.module('buttons',[])
.controller('buttonCtrl',ButtonCtrl)
.factory('buttonApi',buttonApi)
.constant('apiUrl','http://localhost:1337'); // CHANGED for the lab 2017!

function ButtonCtrl($scope, $window, buttonApi) {
  $scope.buttons = []; //Initially all was still
  $scope.current_list = [];
  $scope.errorMessage = '';
  $scope.isLoading = isLoading;
  $scope.refreshButtons = refreshButtons;
  $scope.buttonClick = buttonClick;
  $scope.totalCost = totalCost;
  $scope.changeOne = changeOne;
  $scope.truncate = truncate;
  $scope.removeItem = removeItem;
  $scope.username = "";
  $scope.password = "";
  $scope.current_user = null;
  $scope.login = login;
  $scope.submitify = submitify;
  $scope.reload = reload;
  $scope.receiptList = [];

  var loading = false;

  function isLoading(){
    return loading;
  }

  function reload() {
     $window.location.reload();
  }

  function totalCost(list) {
    return list.reduce(function(sum, item) {
      return (item.quantity * item.price) + sum;
    }, 0);
  }

  function login(user, pass) {
    console.log("Well...");
    buttonApi.login(user, pass).success(function(res) {
      if (res.correct) {
        $scope.current_user = user;
        refreshButtons();
      }
    });
  }

  function truncate() {
    if (!$scope.current_user) {
      return;
    }
    if (confirm("Are you sure you want to purge the table?")) {
      buttonApi.truncate($scope.current_list).then(function() {
        $scope.current_list = [];
      });
    }
  }

  function submitify() {
    if (!$scope.current_user) {
      return;
    }
    console.log("You hit submit");
    buttonApi.submit($scope.current_user, $scope.totalCost($scope.current_list)).then(function() {
      console.log("Well that did something!");
      buttonApi.truncate($scope.current_user).then(function() {
        $scope.receiptList = $scope.current_list;
        $scope.current_list = [];
      });
    });
  }

  function changeOne(item, quantity) {
    if (!$scope.current_user) {
      return;
    }
    if (quantity == 0 || (item.quantity <= 0 && quantity < 0)) {
      console.log("You can't have a negative number of items, or remove zero items.");
    } else {
      buttonApi.changeOne(item.invID, quantity).success(function(res) {
        item.quantity = parseInt(item.quantity) + parseInt(res.quantity);
        if (item.quantity == 0) {
          removeItem(item);
        }truncate
      });
    }
  }

  function refreshButtons() {
    loading = true;
    $scope.errorMessage = '';
    buttonApi.getButtons()
    .success(function(data){
      $scope.buttons = data;
      buttonApi.getCurrent($scope.current_user).success(function(list) {
        $scope.current_list = list;
        loading = false;
      });
    })
    .error(function () {
      $scope.errorMessage="Unable to load Buttons: Database request failed";
      alert($scope.errorMessage);
      loading=false;
    });
  }

  function removeItem(item) {
    if (!$scope.current_user) {
      return;
    }
    console.log(item);
    buttonApi.removeItem(item.invID).then(function(res) {
      if (res.err) {
        console.log(res.err);
      } else {
        for (var i = 0; i < $scope.current_list.length; i++) {
          if ($scope.current_list[i].invID == item.invID) {
            $scope.current_list.splice(i, 1);
          }
        }
      }
    });
  }

  function buttonClick($event, buttonID, invID) {
    if (!$scope.current_user) {
      return;
    }
    $scope.errorMessage = '';
    buttonApi.clickButton($event.target.id, $scope.current_user)
    .success(function() {
      buttonApi.getCurrent($scope.current_user).success(function(data) {
        $scope.current_list = data;
      });
    })
    .error(function() {
      $scope.errorMessage="Unable to complete click";
    });
  }

}

function buttonApi($http,apiUrl) {
  return {
    getButtons: function() {
      var url = apiUrl + '/buttons';
      return $http.get(url);
    },
    clickButton: function(id, user) {
      var url = apiUrl + '/click/' + id + "/" + user;
      return $http.get(url);
    },
    getCurrent: function(user) {
      var url = apiUrl + '/current/' + user;
      return $http.get(url);
    },
    truncate: function(user) {
      console.log("Truncating now");
      return $http.get(apiUrl+'/truncate/' + user);
    },
    changeOne: function(id, quantity) {
      var url = apiUrl + '/changeOne/'+id+'/'+quantity;
      return $http.get(url);
    },
    removeItem: function(id) {
      var url = apiUrl + '/removeItem/'+id;
      return $http.get(url);
    },
     login: function(user, pass) {
      var url = apiUrl + '/login/' + user + '/' + pass;
      return $http.get(url);
    },
    submit: function(user, total){
      var url = apiUrl + '/submit/' + user + '/' + total;
      console.log(url);
      return $http.get(url);
    }
  };
}
