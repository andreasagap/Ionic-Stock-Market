angular.module('YourApp.services', [])



.service('modalService', function($ionicModal) {

    this.openModal = function (id) {

        var _this = this;

        if (id == 1) {
            $ionicModal.fromTemplateUrl('templates/search.html', {
                scope: null,
                controller: 'SearchCtrl'
            }).then(function (modal) {
                _this.modal = modal;
                _this.modal.show();
            });
        }
        else if (id == 2) {
            $ionicModal.fromTemplateUrl('templates/login.html', {
                scope: null,
                controller: 'LoginSearchCtrl'
            }).then(function (modal) {
                _this.modal = modal;
                _this.modal.show();
            });
        }
        else if (id == 3) {
            $ionicModal.fromTemplateUrl('templates/signup.html', {
                scope: null,
                controller: 'LoginSearchCtrl'
            }).then(function (modal) {
                _this.modal = modal;
                _this.modal.show();
            });
        }
    };

    this.closeModal = function() {

        var _this = this;

        if(!_this.modal) return;
        _this.modal.hide();
        _this.modal.remove();
    };

})

.factory('firebaseDBRef', function () {
    return firebase.database().ref();
})



.factory('firebaseAuthRef', function () {
    return firebase.auth();
})



.factory('firebaseUserRef', function (firebaseDBRef) {
    return firebaseDBRef.child('users');
})


.factory('userService', function ($rootScope, $window, $timeout, firebaseDBRef, firebaseAuthRef, firebaseUserRef, myStocksCacheService,myStocksArrayService, notesCacheService, modalService) {

  var login = function(user) {

      var email = user.email;
      var password = user.password;

      firebaseAuthRef.signInWithEmailAndPassword(email, password)
        .then(function (authData) {
            $rootScope.currentUser = authData;

            if (signup) {
                modalService.closeModal();
            }
            else {
                myStocksCacheService.removeAll();
                notesCacheService.removeAll();

                loadUserData(authData);
                modalService.closeModal();
                $timeout(function () {
                    $window.location.reload(true);
                }, 400);
            }
        })
        .catch(function (error) {
            console.log("Login Failed!", error);
            return false;
        });
  };

  var signup = function (user) {

      firebaseAuthRef.createUserWithEmailAndPassword(user.email, user.password)
      .then(function (userData) {
          console.log(userData);
          login(user, true);
          firebaseDBRef.child('emails').push(user.email);
          firebaseUserRef.child(userData.uid).child('stocks').set(myStocksArrayService);

          var stocksWithNotes = notesCacheService.keys();

          stocksWithNotes.forEach(function (stockWithNotes) {
              var notes = notesCacheService.get(stockWithNotes);

              notes.forEach(function (note) {
                  firebaseUserRef.child(userData.uid).child('notes').child(note.ticker).push(note);
              });
          });
      })
      .catch(function (error) {
          console.log("Error creating user:", error);
          return false;
      });
  };

  var logout = function () {
      firebaseAuthRef.signOut();
      notesCacheService.removeAll();
      myStocksCacheService.removeAll();
      $window.location.reload(true);
      $rootScope.currentUser = '';
  };

  var updateStocks = function (stocks) {
      firebaseUserRef.child(getUser().uid).child('stocks').set(stocks);
  };

  var updateNotes = function (ticker, notes) {
      firebaseUserRef.child(getUser().uid).child('notes').child(ticker).remove();
      notes.forEach(function (note) {
          firebaseUserRef.child(getUser().uid).child('notes').child(note.ticker).push(note);
      });
  };

  var loadUserData = function (authData) {

      firebaseUserRef.child(authData.uid).child('stocks').once('value', function (snapshot) {
          var stocksFromDatabase = [];

          snapshot.val().forEach(function (stock) {
              var stockToAdd = { ticker: stock.ticker };
              stocksFromDatabase.push(stockToAdd);
          });

          myStocksCacheService.put('myStocks', stocksFromDatabase);
      },
      function (error) {
          console.log("Firebase error –> stocks" + error);
      });

      firebaseUserRef.child(authData.uid).child('notes').once('value', function (snapshot) {

          snapshot.forEach(function (stocksWithNotes) {
              var notesFromDatabase = [];
              stocksWithNotes.forEach(function (note) {
                  notesFromDatabase.push(note.val());
                  var cacheKey = note.child('ticker').val();
                  notesCacheService.put(cacheKey, notesFromDatabase);
              });
          });
      },
      function (error) {
          console.log("Firebase error –> notes: " + error);
      });
  };

  var getUser = function () {
      return firebaseAuthRef.currentUser;
  };

  if (getUser()) {
      $rootScope.currentUser = getUser();
  }

  return {
      login: login,
      signup: signup,
      logout: logout,
      updateStocks: updateStocks,
      updateNotes: updateNotes,
      getUser: getUser
  };
})



.factory('stockDataService', function ($q, $http, stockDetailsCacheService) {
    var getDetailsData = function (ticker) {

        var deferred = $q.defer(),
        cacheKey = ticker,
        stockDetailsCache=stockDetailsCacheService.get(cacheKey),
       url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22" + ticker + "%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=";
        if (stockDetailsCache) {
            deferred.resolve(stockDetailsCache);
        }
        else {
            $http.get(url)
         .success(function (json) {
             var jsonData = json.query.results.quote;
             deferred.resolve(jsonData);
             stockDetailsCacheService.put(cacheKey, jsonData);
         })
        .error(function (error) {
            console.log("Details data error: " + error);
            deferred.reject();
        });
        }
           

        return deferred.promise;
    };

    return {
        getDetailsData: getDetailsData
    };
})



.factory('notesCacheService', function (CacheFactory) {

    var notesCache;

    if (!CacheFactory.get('notesCache')) {
        notesCache = CacheFactory('notesCache', {
            storageMode: 'localStorage'
        });
    }
    else {
        notesCache = CacheFactory.get('notesCache');
    }

    return notesCache;
})


.factory("stockDetailsCacheService", function (CacheFactory)
{
    var stockDetailsCache;
    if (!CacheFactory.get('stockDetailsCache')) {
        stockDetailsCache = CacheFactory('stockDetailsCache', {
            maxAge: 60 * 1000,
            deleteOnExpire: 'aggressive',
            storageMode: 'localStorage'
        });
    }
    else {
        stockDetailsCache = CacheFactory.get('stockDetailsCache');
    }
    return stockDetailsCache;
})



.factory('notesService', function (notesCacheService, userService) {

    return {

        getNotes: function (ticker) {
            return notesCacheService.get(ticker);
        },

        addNote: function (ticker, note) {

            var stockNotes = [];

            if (notesCacheService.get(ticker)) {
                stockNotes = notesCacheService.get(ticker);
                stockNotes.push(note);
            }
            else {
                stockNotes.push(note);

            }

            notesCacheService.put(ticker, stockNotes);
            if (userService.getUser()) {
                var notes = notesCacheService.get(ticker);
                userService.updateNotes(ticker, notes);
            }
        },

        deleteNote: function (ticker, index) {

            var stockNotes = [];

            stockNotes = notesCacheService.get(ticker);
            stockNotes.splice(index, 1);
            notesCacheService.put(ticker, stockNotes);
            if (userService.getUser()) {
                var notes = notesCacheService.get(ticker);
                userService.updateNotes(ticker, notes);
            }
        }
    };
})



.factory('fillMyStocksCacheService', function (CacheFactory) {

    var myStocksCache;

    if (!CacheFactory.get('myStocksCache')) {
        myStocksCache = CacheFactory('myStocksCache', {
            storageMode: 'localStorage'
        });
    }
    else {
        myStocksCache = CacheFactory.get('myStocksCache');
    }

    var fillMyStocksCache = function () {
        
        var myStocksArray = [
          { ticker: "AAPL" },
          { ticker: "GPRO" },
          { ticker: "FB" },
          { ticker: "NFLX" },
          { ticker: "TSLA" },
          { ticker: "BRK-A" },
          { ticker: "INTC" },
          { ticker: "MSFT" },
          { ticker: "GE" },
          { ticker: "BAC" },
          { ticker: "C" },
          { ticker: "T" }
        ];

        myStocksCache.put('myStocks', myStocksArray);
    };

    return {
        fillMyStocksCache: fillMyStocksCache
    };
})



.factory('myStocksCacheService', function (CacheFactory) {
    var myStocksCache;
    if (!CacheFactory.get('myStocksCache')) {
        myStocksCache = CacheFactory('myStocksCache', {
            storageMode: 'localStorage'
        });
    }
    else {
        myStocksCache = CacheFactory.get('myStocksCache');
    }
    
    return myStocksCache;
})


.factory('myStocksArrayService', function (fillMyStocksCacheService, myStocksCacheService) {

   if (!myStocksCacheService.info('myStocks')) {
        fillMyStocksCacheService.fillMyStocksCache();
   }
   
    var myStocks = myStocksCacheService.get('myStocks');

    return myStocks;
})

.factory('followStockService', function (myStocksArrayService, myStocksCacheService, userService) {

    return {

        follow: function (ticker) {

            var stockToAdd = { "ticker": ticker };

            myStocksArrayService.push(stockToAdd);
            myStocksCacheService.put('myStocks', myStocksArrayService);
            if (userService.getUser()) {
                userService.updateStocks(myStocksArrayService);
            }
        },

        unfollow: function (ticker) {

            for (var i = 0; i < myStocksArrayService.length; i++) {
                if (myStocksArrayService[i].ticker == ticker) {

                    myStocksArrayService.splice(i, 1);
                    myStocksCacheService.remove('myStocks');
                    myStocksCacheService.put('myStocks', myStocksArrayService);
                    if (userService.getUser()) {
                        userService.updateStocks(myStocksArrayService);
                    }

                    break;
                }
            }
        },

        checkFollowing: function (ticker) {

            for (var i = 0; i < myStocksArrayService.length; i++) {
                if (myStocksArrayService[i].ticker == ticker) {
                    return true;
                }
            }

            return false;
        }
    };
})


.factory('newsService', function ($q, $http) {
    
    return {

        getNews: function (ticker) {

            var deferred = $q.defer(),

            x2js = new X2JS(),

            url = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=" + ticker + "&region=US&lang=en-US";
            $http.get(url)
              .success(function (xml) {
                  var xmlDoc = x2js.parseXmlString(xml),
                  json = x2js.xml2json(xmlDoc),
                  jsonData = json.rss.channel.item;
                  deferred.resolve(jsonData);
              })
              .error(function (error) {
                  deferred.reject();
                  console.log("News error: " + error);
              });

            return deferred.promise;
        }
    };
})

.factory('searchService',function($q,$http){
    return {

        search: function(query) {

            var deferred = $q.defer(),

            url = 'http://d.yimg.com/aq/autoc?query=' + query + '&region=US&lang=en-US';

           $http.get(url).success(function(data){
               var jsonData = data.ResultSet.Result;
               deferred.resolve(jsonData);
           })


            return deferred.promise;
        }
    };
})


