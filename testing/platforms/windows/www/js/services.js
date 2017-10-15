angular.module('YourApp.services', [])

.factory('stockDataService',function($q,$http,stockDetailsCacheService){
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



.factory('notesService', function (notesCacheService) {

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
        },

        deleteNote: function (ticker, index) {

            var stockNotes = [];

            stockNotes = notesCacheService.get(ticker);
            stockNotes.splice(index, 1);
            notesCacheService.put(ticker, stockNotes);
        }
    };
})



.factory('newsService', function ($q, $http) {
    
    return {

        getNews: function (ticker) {

            var deferred = $q.defer(),

            x2js = new X2JS(),

            url = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=" + ticker + "&region=US&lang=en-US";
            console.log(url, x2js);
            $http.get(url)
              .success(function (xml) {
                  var xmlDoc = x2js.parseXmlString(xml),
                  json = x2js.xml2json(xmlDoc),
                  jsonData = json.rss.channel.item;
                  console.log("News error: " + jsonData);
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


;