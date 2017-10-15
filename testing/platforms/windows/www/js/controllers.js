angular.module('YourApp.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('MyStocksCtrl', function($scope) {
    $scope.myStocksArray = [
         { ticker: "AAPL" },
         { ticker: "GPRO" },
         { ticker: "FB" },
         { ticker: "NFLX" },
         { ticker: "TSLA" },
         { ticker: "INTC" },
         { ticker: "MSFT" },
         { ticker: "GE" },
         { ticker: "BAC" },
         { ticker: "C" },
         { ticker: "T" }
    ]
})

.controller('StockCtrl', function ($scope, $stateParams, stockDataService, $ionicPopup, notesService,newsService) {
    
    $scope.ticker = $stateParams.stockTicker;
    $scope.stockNotes = [];
    $scope.$on("$ionicView.afterEnter", function () {
        getDetailsData();
        getNews();
        $scope.stockNotes = notesService.getNotes($scope.ticker);
    });

    $scope.openWindow = function(link) {
             //TODO install and set up inAppBrowser
              console.log("openWindow �> " + link);
           };

    $scope.addNote = function () {
        $scope.note = { title: 'Note', body: '', date: $scope.todayDate, ticker: $scope.ticker };

        var note = $ionicPopup.show({
            template: '<input type="text" ng-model="note.title" id="stock-note-title"><textarea type="text" ng-model="note.body" id="stock-note-body"></textarea>',
            title: 'New Note for ' + $scope.ticker,
            scope: $scope,
            buttons: [
              {
                  text: 'Cancel',
                  onTap: function (e) {
                      return;
                  }
              },
              {
                  text: '<b>Save</b>',
                  type: 'button-balanced',
                  onTap: function (e) {
                      notesService.addNote($scope.ticker, $scope.note);
                  }
              }
            ]
        });

        note.then(function (res) {
            $scope.stockNotes = notesService.getNotes($scope.ticker);
        });
    };

    $scope.openNote = function (index, title, body) {
        $scope.note = { title: title, body: body, date: $scope.todayDate, ticker: $scope.ticker };

        var note = $ionicPopup.show({
            template: '<input type="text" ng-model="note.title" id="stock-note-title"><textarea type="text" ng-model="note.body" id="stock-note-body"></textarea>',
            title: $scope.note.title,
            scope: $scope,
            buttons: [
              {
                  text: 'Delete',
                  type: 'button-assertive button-small',
                  onTap: function (e) {
                      notesService.deleteNote($scope.ticker, index);
                  }
              },
              {
                  text: 'Cancel',
                  type: 'button-small',
                  onTap: function (e) {
                      return;
                  }
              },
              {
                  text: '<b>Save</b>',
                  type: 'button-balanced button-small',
                  onTap: function (e) {
                      notesService.deleteNote($scope.ticker, index);
                      notesService.addNote($scope.ticker, $scope.note);
                  }
              }
            ]
        });

        note.then(function (res) {
            $scope.stockNotes = notesService.getNotes($scope.ticker);
        });
    };

    function getDetailsData() {
        var promise = stockDataService.getDetailsData($scope.ticker);
        promise.then(function (data) {
            $scope.stockDetailsData = data;
            if (data.Change >= 0) {
                $scope.reactiveColor = { 'background-color': '#33cd5f' };
            }
            else if (data.Change < 0) {
                $scope.reactiveColor = { 'background-color': '#ef473a' };
            }
        });
    };

    function getNews() {
        
             $scope.newsStories = [];
            var promise = newsService.getNews($scope.ticker);
              promise.then(function(data) {
                    $scope.newsStories = data;
                 });
            }
   
});
