/*globals angular*/
"use strict";


angular.module("lookAroundApp.controllers", [ ])
    
    
    .controller("ZipCodeFrmCtrl", function ($scope, $location, $routeParams) {
        var placeurl = $routeParams.place || "";
        $scope.sendZip = function (zipcode) {
            $location.path("/search/" + zipcode + "/" + placeurl);
        };
    })

   
    .controller("SearchCtrl", function ($scope, $routeParams, $location, googleMap, $http, $filter) {
        $scope.zipCode = $routeParams.zipcode;
        $scope.place = $routeParams.place;
        
        /* redirect to the home page if there's no zipcode */
        if (!$scope.zipCode) {
            $location.path("/");
        }

        
        $http.get("data/places.json").success(function (results) {
            $scope.places = results.data;
        });
        
        
        $scope.getUrl = function (placeurl) {
            return "#/search/" + $scope.zipCode + placeurl;
        };
        
        
        $scope.activeClass = function (place) {
            return place.url.slice(1).toLowerCase() === $scope.place ? "active" : "";
        };
        
        
        $scope.getLocation = function (details) {
            var location = ( details && details.geometry && details.geometry.location ),
                out = [ ];
            if (!location) {
                return "location not available";
            } else {
                angular.forEach(location, function (value, key) {
                    this.push($filter("number")(value, 4));
                }, out);
                return out.join(", ");
            }
        };

        if (!$scope.place) {
            /* select the default place type as 'atm' */
            $location.path($scope.getUrl("/atm").slice(1));
        } else {
            /* 
            start the Geocoding to get the latitude and longitude from the 
            zipcode proviced. This lat/long will be served to the places api to fetch the places details
            */
            googleMap.getGeoCoder().geocode({
                address: $scope.zipCode
            }, function (results, status) {
                var lat = results[ 0 ].geometry.location.lat(),
                    lng = results[ 0 ].geometry.location.lng();

                /* $scope.$apply is required as this function will be executed inside the GeoCoder context */
                $scope.$apply(function () {
                    $scope.searchplace = results[ 0 ] && results[ 0 ].formatted_address;
                });

                /* Do a text search and find all the places for the given query ( place type ) */
                googleMap.placeService.textSearch({
                    query: $scope.place,
                    type: $scope.place,
                    location: new googleMap._maps.LatLng(lat, lng),
                    radius: 50
                }, function (data) {
                    /* 
                    Once getting the data, set it to the controller scope.
                    $scope.$apply is required because this function will be executed in the googleMap object scope
                    */
                    $scope.$apply(function () {
                        $scope.data = data;
                    });
                });
            });
        }

    })
    
   
    .controller("ResultsTabCtrl", function ($scope, $routeParams, $location, googleMap, scrollToElem) {
        $scope.tabs = {
            "map": false,
            "list": true
        };
        $scope.selectedMarker = 0;

        $scope.listView = function () {
            $scope.tabs = {
                "map": false,
                "list": true
            };
        };

        $scope.mapView = function () {
            $scope.tabs = {
                "map": true,
                "list": false
            };
        };

        $scope.selectFromList = function(num) {
            $scope.mapView();
            $scope.selectedMarker = num;
            // need to get better user experience
            googleMap.zoomToMarker(num);
            googleMap.bounceMarker(num);
        }

       
        $scope.$watch(function () {
            return googleMap.selectedMarkerIdx;
        }, function (newVal) {
            var fn = function () {
                $scope.selectedMarker = newVal;
                if (newVal !== null) {
                    $scope.listView();
                    // need to get better user experience
                    googleMap.zoomToMarker(newVal);
                    googleMap.bounceMarker(newVal);
                    scrollToElem.scrollTo("listItem" + newVal);
                }
            };
            fn();
        });
    })
    
   
    .controller("MainCtrl", function ($scope, $routeParams, $location, $window) {
        // checks if the url contains any valid zipcode
        $scope.applied = function () {
            return !!$routeParams.zipcode;
        };
        // some Google analytics
        $scope.$on("$viewContentLoaded", function (event) {
            $window.ga("send", "pageview", {
                "page": $location.path()
            });
        });
    })

    // Just shows something about me and how I did this.
    .controller("AboutDialogCtrl", function ($scope, $window) {
        $scope.opened = false;
        $scope.open = function () {
            $scope.opened = true;
            $window.ga("send", "pageview", {
                "page": "about.html"
            });
        };

        $scope.close = function () {
            $scope.opened = false;
        };

        /* For the twitter bootstrap plugins */
        $scope.opts = {
            backdropFade: true,
            dialogFade: true
        };
    });
