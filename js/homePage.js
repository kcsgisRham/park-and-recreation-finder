/*global */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true */
/*
 | Copyright 2012 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
dojo.require("esri.map");
dojo.require("esri.tasks.geometry");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.tasks.locator");
dojo.require("dojo.date.locale");
dojo.require("dojox.mobile");
dojo.require("js.Config");
dojo.require("dojo.window");
dojo.require("js.date");
dojo.require("dojo.number");
dojo.require("js.InfoWindow");
dojo.require("esri.tasks.route");

var baseMapLayers;  //Variable to store base map layers
var devPlanLayerURL; //Variable to store Feature layer URL
var parkCommentsLayer;  //Variable to store park comments layer URL
var referenceOverlayLayer; //Variable to store Reference Overlay Layer
var geometryService; //Variable to store Geometry Service

var formatDateAs; //variable to store the date format
var fontSize; //Variable to store font sizes for all devices
var showNullValueAs; //Variable to store default value for replacing null values

var infoActivity; //variable to store the activities for a park
var infoBoxWidth; //variable to store the width of the carousel pod
var infoWindowContent; //variable to store content for info window
var infoPopupFieldsCollection;  //variable to store info window fields
var infoWindowHeader; //variable to store info window header title
var infoWindowHeight;  //variable to store info window height
var infoWindowWidth; //variable to store info window width

var isBrowser = false; //This variable is set to true when the app is running on desktop browsers
var isiOS = false; //This variable is set to true when the app is running on iPhone or iPad
var isMobileDevice = false;  //This variable is set to true when the app is running on mobile device
var isTablet = false; //This variable is set to true when the app is running on tablets

var map; //variable to store map object
var mapPoint; //variable to store map point

var mapSharingOptions; //variable for storing the tiny service URL
var messages; //Variable to store the error messages

var devPlanLayerID = "devPlanLayerID"; //variable to store park layer ID
var parkCommentsLayerId = "parkCommentsLayerId"; //variable to store park comments layer ID
var tempGraphicsLayerId = "tempGraphicsLayerID"; //variable to store graphics layer ID
var highlightPollLayerId = "highlightPollLayerId"; //Graphics layer object for displaying selected park
var routeLayerId = "routeLayerId"; //variable to store graphics layer ID for routing

var selectedGraphic; // variable to store selected map point

var tempBufferLayer = "tempBufferLayer"; // variable to store Graphics layer object
var bufferDistance; //variable to store distance for drawing the buffer

var rendererColor; //variable to store buffer color
var order; //variable to store sequence of info pods
var rippleColor; //variable to store ripple color for selected feature
var routeTask;  //variable to store object for route task
var routeSymbol; //variable to store object for route symbol
var locatorRippleSize; //variable to store locator ripple size

var parkName; //variable to store park name object
var selectedPark; //variable to store selected park
var isParkSearched = false; //flag set true/false for the park searched
var searchedPark; //variable to store searched park

var searchAddressViaPod = false; //flag set true if the address is searched through pods in the bottom panel
var loadingIndicatorCounter = 0;

var handlers = []; //Array to hold handlers
var handlersPod = []; //Array to hold handlers pod

var directionsHeaderArray = []; //Array to hold directions in header
var getDirections; // master variable for directions
var resultFound = false;
var printFlag = false; //flag set true to enable printing
var loadingAttachmentsImg = "images/imgAttachmentLoader.gif"; //variable to store the path of attachment loader image
var loaderImg = "images/loader.gif"; //variable to store the path of loading image

var nameAttribute;
var locatorSettings; //variable to store locator settings

var getDirectionsMobile; //flag to enable/disable directions for Mobile/tablet
var getDirectionsDesktop; //flag to enable/disable directions for desktop

var primaryKeyForComments; //variable to store  primary key attribute for comments
var facilityId; //variable to store primary key for park layer

var commentsInfoPopupFieldsCollection; //variable to store fields for adding and displaying comment
var databaseFields; // Define the database field names


var lastSearchString; //variable for store the last search string
var stagedSearch; //variable for store the time limit for search
var lastSearchTime; //variable for store the time of last search

//This initialization function is called when the DOM elements are ready
function Init() {
    esri.config.defaults.io.proxyUrl = "proxy.ashx"; //relative path
    esriConfig.defaults.io.alwaysUseProxy = false;
    esriConfig.defaults.io.timeout = 180000; // milliseconds

    var userAgent = window.navigator.userAgent;
    if (userAgent.indexOf("iPhone") >= 0 || userAgent.indexOf("iPad") >= 0) {
        isiOS = true;
    }
    if (userAgent.indexOf("Android") >= 0 || userAgent.indexOf("iPhone") >= 0) {
        fontSize = 15;
        isMobileDevice = true;
        dojo.byId("dynamicStyleSheet").href = "styles/mobile.css";
    } else if (userAgent.indexOf("iPad") >= 0) {
        fontSize = 14;
        isTablet = true;
        dojo.byId("dynamicStyleSheet").href = "styles/tablet.css";
    } else {
        fontSize = 11;
        isBrowser = true;
        dojo.byId("dynamicStyleSheet").href = "styles/browser.css";
    }
    dojo.byId("divSplashContent").style.fontSize = fontSize + "px";


    dojo.connect(dojo.byId("txtAddress"), "onpaste", function () {
        CutAndPasteTimeout();
    });

    function CutAndPasteTimeout() {
        searchAddressViaPod = false;
        setTimeout(function () {
            LocateParkAndAddress();
        }, 100);
    }
    dojo.connect(dojo.byId("txtAddress"), "oncut", function () {
        CutAndPasteTimeout();
    });

    function LocateParkAndAddress() {
        if (dojo.byId("tdSearchAddress").className === "tdSearchByAddress") {
            LocateAddress();
        } else if (dojo.byId("tdSearchPark").className === "tdSearchByPark") {
            LocateParkbyName();
        }
    }

    dojo.connect(dojo.byId("txtAddress"), "onkeyup", function (evt) {
        searchAddressViaPod = false;
        if (evt) {
            var keyCode = evt.keyCode;
            if (keyCode === 8) { // To handle backspace
                resultFound = false;
            }
            if (keyCode === 27) {
                RemoveChildren(dojo.byId("tblAddressResults"));
                RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
                return;
            }

            if (evt.keyCode == dojo.keys.ENTER) {
                if (dojo.byId("txtAddress").value != '') {
                    LocateParkAndAddress();
                    return;
                }
            }

            //validations for auto complete search
            if ((!((evt.keyCode >= 46 && evt.keyCode < 58) || (evt.keyCode > 64 && evt.keyCode < 91) || (evt.keyCode > 95 && evt.keyCode < 106) || evt.keyCode === 8 || evt.keyCode === 110 || evt.keyCode === 188)) || (evt.keyCode === 86 && evt.ctrlKey) || (evt.keyCode === 88 && evt.ctrlKey)) {
                evt = (evt) ? evt : event;
                evt.cancelBubble = true;
                if (evt.stopPropagation) {
                    evt.stopPropagation();
                }
                return;
            }
            if (dojo.coords("divAddressContent").h > 0) {
                if (dojo.byId("txtAddress").value.trim() !== "") {
                    if (lastSearchString !== dojo.byId("txtAddress").value.trim()) {
                        lastSearchString = dojo.byId("txtAddress").value.trim();
                        RemoveChildren(dojo.byId("tblAddressResults"));

                        // Clear any staged search
                        clearTimeout(stagedSearch);

                        if (dojo.byId("txtAddress").value.trim().length > 0) {
                            // Stage a new search, which will launch if no new searches show up
                            // before the timeout
                            stagedSearch = setTimeout(function () {
                                LocateParkAndAddress();
                            }, 500);
                        }
                    }
                } else {
                    lastSearchString = dojo.byId("txtAddress").value.trim();
                    dojo.byId("imgSearchLoader").style.display = "none";
                    RemoveChildren(dojo.byId("tblAddressResults"));
                    CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
                }
            }

        }
    });


    handlers.push(dojo.connect(dojo.byId("imgLocate"), "onclick", function () {
        searchAddressViaPod = false;
        if (dojo.byId("tdSearchAddress").className === "tdSearchByAddress") {
            if (dojo.byId("txtAddress").value.trim() === "") {
                alert(messages.getElementsByTagName("addressToLocate")[0].childNodes[0].nodeValue);
                return;
            }
            LocateAddress();
        } else if (dojo.byId("tdSearchPark").className === "tdSearchByPark") {
            resultFound = false;
            if (dojo.byId("txtAddress").value.trim() === "") {
                alert(messages.getElementsByTagName("parkToLocate")[0].childNodes[0].nodeValue);
                return;
            }
            LocateParkbyName();
        } else if (dojo.byId("tdSearchActivity").className === "tdSearchByActivity") {
            LocateParkbyActivity();
        }
    }));

    if (!Modernizr.geolocation) {
        dojo.byId("tdGeolocation").style.display = "none";
    }

    var responseObject = new js.Config();

    Initialize(responseObject);
}

//this function is called to load the configurable parameters
function Initialize(responseObject) {
    var infoWindow = new js.InfoWindow({
        domNode: dojo.create("div", null, dojo.byId("map"))
    });
    if (isMobileDevice) {
        dojo.byId("divInfoContainer").style.display = "none";
        dojo.removeClass(dojo.byId("divInfoContainer"), "opacityHideAnimation");
        dojo.byId("divResults").style.display = "none";
        dojo.removeClass(dojo.byId("divResults"), "opacityHideAnimation");
        dojo.replaceClass("divAddressHolder", "hideContainer", "hideContainerHeight");
        dojo.byId("divAddressContainer").style.display = "none";
        dojo.removeClass(dojo.byId("divAddressContainer"), "hideContainerHeight");
        dojo.byId("divSplashScreenContent").style.width = "95%";
        dojo.byId("divSplashScreenContent").style.height = "95%";
        dojo.byId("divLogo").style.display = "none";
        dojo.byId("lblAppName").style.display = "none";
        dojo.byId("lblAppName").style.width = "80%";
        dojo.byId("divToggle").style.display = "none";
    } else {
        dojo.byId("imgDirections").style.display = "none";
        dojo.byId("imgList").style.display = "none";
        var imgBasemap = document.createElement("img");
        imgBasemap.src = "images/imgBaseMap.png";
        imgBasemap.className = "imgOptions";
        imgBasemap.title = "Switch Basemap";
        imgBasemap.id = "imgBaseMap";
        imgBasemap.style.cursor = "pointer";
        imgBasemap.onclick = function () {
            ShowBaseMaps();
        };
        dojo.byId("tdBaseMap").appendChild(imgBasemap);
        dojo.byId("tdBaseMap").className = "tdHeader";
        dojo.byId("divSplashScreenContent").style.width = "350px";
        dojo.byId("divSplashScreenContent").style.height = "290px";
        dojo.byId("divAddressContainer").style.display = "block";
        dojo.byId("divLogo").style.display = "block";
        dojo.byId("imgMblNextImg").style.display = "none";
        dojo.byId("imgMblPrevImg").style.display = "none";
    }

    locatorSettings = responseObject.LocatorSettings;
    devPlanLayerURL = responseObject.DevPlanLayer;
    infoBoxWidth = responseObject.InfoBoxWidth;
    dojo.byId("imgApp").src = responseObject.ApplicationIcon;
    dojo.byId("lblAppName").innerHTML = responseObject.ApplicationName;
    dojo.byId("divSplashContent").innerHTML = responseObject.SplashScreenMessage;

    dojo.xhrGet({
        url: "ErrorMessages.xml",
        handleAs: "xml",
        preventCache: true,
        load: function (xmlResponse) {
            messages = xmlResponse;
        }
    });

    map = new esri.Map("map", {
        slider: true,
        infoWindow: infoWindow
    });

    ShowProgressIndicator();

    geometryService = new esri.tasks.GeometryService(responseObject.GeometryService);
    commentsInfoPopupFieldsCollection = responseObject.CommentsInfoPopupFieldsCollection;
    databaseFields = responseObject.DatabaseFields;
    getDirectionsMobile = responseObject.GetDirectionsMobile;
    getDirectionsDesktop = responseObject.GetDirectionsDesktop;
    baseMapLayers = responseObject.BaseMapLayers;
    mapSharingOptions = responseObject.MapSharingOptions;
    formatDateAs = responseObject.FormatDateAs;
    showNullValueAs = responseObject.ShowNullValueAs;
    infoActivity = responseObject.Activities;
    infoWindowHeader = responseObject.InfoWindowHeader;
    infoWindowContent = responseObject.InfoWindowContent;
    infoPopupFieldsCollection = responseObject.InfoPopupFieldsCollection;
    infoWindowHeight = responseObject.InfoPopupHeight;
    infoWindowWidth = responseObject.InfoPopupWidth;
    parkCommentsLayer = responseObject.ParkCommentsLayer;
    facilityId = responseObject.PrimaryKeyForParks;
    primaryKeyForComments = responseObject.PrimaryKeyForComments;
    bufferDistance = responseObject.BufferDistance;
    rendererColor = responseObject.BufferColor;
    order = responseObject.Order;
    rippleColor = responseObject.RippleColor;
    routeTask = new esri.tasks.RouteTask(responseObject.RouteServiceURL);
    dojo.connect(routeTask, "onSolveComplete", ShowRoute);
    dojo.connect(routeTask, "onError", ErrorHandler);
    routeSymbol = new esri.symbol.SimpleLineSymbol().setColor(responseObject.RouteColor).setWidth(responseObject.RouteWidth);
    parkName = responseObject.ParkName;
    locatorRippleSize = responseObject.LocatorRippleSize;
    getDirections = responseObject.GetDirections;
    referenceOverlayLayer = responseObject.ReferenceOverlayLayer;

    if (isTablet) {
        dojo.byId("tdPreviousImg").style.width = "55px";
        dojo.byId("tdNextImg").style.width = "55px";
    }
    parkName.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function (match, key) {
        nameAttribute = key;
    });
    dojo.byId("tdSearchAddress").innerHTML = locatorSettings.Locators[0].DisplayText;
    dojo.byId("tdSearchPark").innerHTML = locatorSettings.Locators[1].DisplayText;
    dojo.byId("tdSearchActivity").innerHTML = locatorSettings.Locators[2].DisplayText;

    var tr = dojo.byId("tblCarousel").insertRow(0);
    for (var i in order) {
        dojo.query("[type=" + order[i] + "]").forEach(function (node) {
            var td = tr.insertCell(i);
            if (order[i] === "photogallery") {
                td.id = "tdPhotoGallery";
            }
            if (order[i] === "directions") {
                td.id = "tdDirectionsPod";
                if (!getDirections) {
                    td.style.display = "none";
                }
            }
            if (order[i] === "comments") {
                td.id = "tdCommentsPod";
            }
            td.appendChild(node);
            node.style.width = infoBoxWidth + "px";
        });
    }

    CreateBaseMapComponent();

    var routeLayer = new esri.layers.GraphicsLayer();
    routeLayer.id = routeLayerId;
    map.addLayer(routeLayer);

    if (!isMobileDevice) {
        TouchEvent();
    } else {
        TouchImage();
    }

    dojo.connect(map, "onLoad", function () {
        routeParams = new esri.tasks.RouteParameters();
        routeParams.stops = new esri.tasks.FeatureSet();
        routeParams.returnRoutes = false;
        routeParams.returnDirections = true;
        routeParams.directionsLengthUnits = esri.Units.MILES;
        routeParams.outSpatialReference = map.spatialReference;
        var zoomExtent;
        var extent = GetQuerystring("extent");
        if (extent !== "") {
            zoomExtent = extent.split(",");
        } else {
            zoomExtent = responseObject.DefaultExtent.split(",");
        }
        var startExtent = new esri.geometry.Extent(parseFloat(zoomExtent[0]), parseFloat(zoomExtent[1]), parseFloat(zoomExtent[2]), parseFloat(zoomExtent[3]), map.spatialReference);
        map.setExtent(startExtent);
        MapInitFunction();
    });

    dojo.connect(map, "onExtentChange", function () {
        SetMapTipPosition();
        if (dojo.coords("divAppContainer").h > 0) {
            ShareLink(false);
        }
    });

    dojo.byId("txtAddress").setAttribute("defaultAddress", locatorSettings.Locators[0].LocatorDefaultAddress);
    dojo.byId("txtAddress").value = locatorSettings.Locators[0].LocatorDefaultAddress;
    lastSearchString = dojo.byId("txtAddress").value.trim();
    dojo.byId("txtAddress").setAttribute("defaultAddressTitle", locatorSettings.Locators[0].LocatorDefaultAddress);
    dojo.byId("txtAddress").style.color = "gray";

    dojo.byId("txtAddress").setAttribute("defaultParkName", locatorSettings.Locators[1].LocatorDefaultPark);
    dojo.byId("txtAddress").setAttribute("defaultParkTitle", locatorSettings.Locators[1].LocatorDefaultPark);

    dojo.byId("txtPodAddress").value = locatorSettings.Locators[0].LocatorDefaultAddress;
    lastPodSearchString = dojo.byId("txtPodAddress").value;
    dojo.byId("txtPodAddress").style.color = "gray";
    dojo.byId("txtPodAddress").setAttribute("defaultAddress", locatorSettings.Locators[0].LocatorDefaultAddress);
    dojo.byId("txtPodAddress").setAttribute("defaultAddressPodTitle", locatorSettings.Locators[0].LocatorDefaultAddress);

    dojo.connect(dojo.byId("txtAddress"), "ondblclick", ClearDefaultText);
    dojo.connect(dojo.byId("txtAddress"), "onblur", ReplaceDefaultText);
    dojo.connect(dojo.byId("txtAddress"), "onfocus", function () {
        this.style.color = "#FFF";
    });

    dojo.connect(dojo.byId("txtPodAddress"), "ondblclick", ClearDefaultText);
    dojo.connect(dojo.byId("txtPodAddress"), "onblur", ReplaceDefaultText);
    dojo.connect(dojo.byId("txtPodAddress"), "onfocus", function () {
        this.style.color = "#FFF";
    });

    dojo.connect(dojo.byId("imgHelp"), "onclick", function () {
        window.open(responseObject.HelpURL);
    });
}

//Function to create graphics and feature layer
function MapInitFunction() {
    if (dojo.query(".logo-med", dojo.byId("map")).length > 0) {
        dojo.query(".esriControlsBR", dojo.byId("map"))[0].id = "imgesriLogo";
    } else if (dojo.query(".logo-sm", dojo.byId("map")).length > 0) {
        dojo.query(".esriControlsBR", dojo.byId("map"))[0].id = "imgesriLogo";
    }
    dojo.addClass("imgesriLogo", "esriLogo");


    dojo.connect(map, "onPanEnd", function () {
        if (printFlag) {
            map.setLevel(currentLevel + 1);
            setTimeout(function () {
                map.setLevel(currentLevel);
            }, 100);
            printFlag = false;
        }
    });

    dojo.connect(map, "onPanStart", function () {
        if (printFlag) {
            currentLevel = map.getLevel();
        }
    });


    var graphicLayer = new esri.layers.GraphicsLayer();
    graphicLayer.id = tempBufferLayer;
    map.addLayer(graphicLayer);

    gLayer = new esri.layers.GraphicsLayer();
    gLayer.id = highlightPollLayerId;
    map.addLayer(gLayer);

    var devPlanLayer = new esri.layers.FeatureLayer(devPlanLayerURL, {
        mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
        outFields: ["*"],
        id: devPlanLayerID
    });

    var facilityID;
    facilityId.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function (match, key) {
        facilityID = key;
    });

    var handle = dojo.connect(devPlanLayer, "onUpdateEnd", function () {
        HideProgressIndicator();
        dojo.disconnect(handle);
        var parkID = GetQuerystring("selectedParkID");
        if (parkID !== "") {
            var query = new esri.tasks.Query();
            query.where = facilityID + "= '" + parkID + "'";
            devPlanLayer.queryFeatures(query, function (results) {
                if (results.features.length > 0) {
                    setTimeout(function () {
                        searchFlag = true;
                        addressFlag = false;
                        defaultPark = results.features[0];
                        selectedPark = results.features[0].geometry;
                        ExecuteQueryForParks(results, null, null, true);
                    }, 500);
                }
            });
        }
    });
    if (referenceOverlayLayer.DisplayOnLoad) {
        var layerType = referenceOverlayLayer.ServiceUrl.substring(((referenceOverlayLayer.ServiceUrl.lastIndexOf("/")) + 1), (referenceOverlayLayer.ServiceUrl.length));
        if (!isNaN(layerType)) {
            var overlaymap = new esri.layers.FeatureLayer(referenceOverlayLayer.ServiceUrl, {
                mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
                outFields: ["*"]
            });
            map.addLayer(overlaymap);

        } else {
            var url1 = referenceOverlayLayer.ServiceUrl + "?f=json";
            esri.request({
                url: url1,
                handleAs: "json",
                load: function (data) {
                    if (!data.singleFusedMapCache) {
                        var imageParameters = new esri.layers.ImageParameters();
                        //Takes a URL to a non cached map service.
                        var overlaymap = new esri.layers.ArcGISDynamicMapServiceLayer(referenceOverlayLayer.ServiceUrl, {
                            "imageParameters": imageParameters
                        });
                        map.addLayer(overlaymap);
                    } else {
                        var overlaymap = new esri.layers.ArcGISTiledMapServiceLayer(referenceOverlayLayer.ServiceUrl);
                        map.addLayer(overlaymap);
                    }
                }
            });
        }
    }
    dojo.connect(devPlanLayer, "onClick", function (evtArgs) {
        searchFlag = false;
        selectedPark = evtArgs.graphic.geometry;
        isParkSearched = false;
        selectedGraphic = null;
        map.infoWindow.hide();
        ShowServiceInfoDetails(evtArgs.graphic.geometry, evtArgs.graphic.attributes);
        evtArgs = (evtArgs) ? evtArgs : event;
        evtArgs.cancelBubble = true;
        if (evtArgs.stopPropagation) {
            evtArgs.stopPropagation();
        }
    });
    map.addLayer(devPlanLayer);

    var commentsLayer = new esri.layers.FeatureLayer(parkCommentsLayer, {
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        outFields: ["*"],
        id: parkCommentsLayerId
    });
    map.addLayer(commentsLayer);
    var gLayer = new esri.layers.GraphicsLayer();
    gLayer.id = tempGraphicsLayerId;
    map.addLayer(gLayer);

    dojo.byId("divSplashScreenContainer").style.display = "block";
    dojo.replaceClass("divSplashScreenContent", "showContainer", "hideContainer");
    SetHeightSplashScreen();

    CreateRatingWidget(dojo.byId("commentRating"));

    if (!isMobileDevice) {
        window.onresize = function () {
            resizeHandler();
            ResetSlideControls();
        };
    } else {
        window.onresize = function () {
            OrientationChanged();
        };
        SetHeightAddressResults();
    }
    HideProgressIndicator();
}
dojo.addOnLoad(Init);
