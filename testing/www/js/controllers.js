angular.module('YourApp.controllers', [])

.controller('AppCtrl', function($scope,modalService, userService) {
    $scope.modalService = modalService;

    $scope.logout = function () {
        userService.logout();
    };
})

.controller('MyStocksCtrl', function ($scope, myStocksArrayService, stockDataService, followStockService) {

      $scope.$on("$ionicView.afterEnter", function () {
          $scope.getMyStocksData();
      });

      $scope.getMyStocksData = function () {

          $scope.myStocksData = [];

          myStocksArrayService.forEach(function (stock) {
              var promise = stockDataService.getDetailsData(stock.ticker);
              promise.then(function (data) {
                  $scope.myStocksData.push(data);
              })
          });
          $scope.$broadcast('scroll.refreshComplete');
      };

      $scope.unfollowStock = function (ticker) {
          followStockService.unfollow(ticker);
          $scope.getMyStocksData();
      };
  })

.controller('StockCtrl', function ($scope, $stateParams, stockDataService, $ionicPopup, notesService,newsService,followStockService) {
    
    $scope.ticker = $stateParams.stockTicker;
    $scope.following = followStockService.checkFollowing($scope.ticker);
    $scope.stockNotes = [];
    $scope.$on("$ionicView.afterEnter", function () {
        getDetailsData();
        getNews();
        $scope.stockNotes = notesService.getNotes($scope.ticker);
    });
    $scope.toggleFollow = function () {
        if($scope.following) {
            followStockService.unfollow($scope.ticker);
                    $scope.following = false;
        }
        else {
          followStockService.follow($scope.ticker);
          $scope.following = true;
       }
    };

    $scope.openWindow = function(link) {
             //TODO install and set up inAppBrowser
              console.log("openWindow –> " + link);
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
                $scope.reactiveColor = { 'background-color': '#33cd5f' ,'border-color': 'rgba(255,255,255,.3)'};
            }
            else if (data.Change < 0) {
                $scope.reactiveColor = { 'background-color': '#ef473a', 'border-color': 'rgba(0,0,0,.2)' };
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
   
})

.controller("SearchCtrl",function($scope,$state,modalService,searchService)
{
    $scope.closeModal = function () {
        modalService.closeModal();
    };
    $scope.search = function () {
        $scope.searchResults =[];
        startSearch($scope.searchQuery);
    };
    var startSearch = ionic.debounce(function (query) {
        searchService.search(query)
          .then(function (data) {
              $scope.searchResults = data;
          });
    }, 750);
    $scope.goToStock = function (ticker) {
        modalService.closeModal();
        $state.go('app.stock', { stockTicker: ticker });
    };
})

.controller('LoginSignupCtrl', function ($scope, modalService, userService) {

    $scope.user = { email: '', password: '' };

    $scope.closeModal = function () {
        modalService.closeModal();
    };

    $scope.signup = function (user) {
        userService.signup(user);
    };

    $scope.login = function (user) {
        userService.login(user);
    };

})