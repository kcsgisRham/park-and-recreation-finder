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
var imgArray = []; //array defined for images
var defaultPark;
var activityQueryString = "";
var searchFlag = false;
var addressFlag = true;


//Get candidate results for searched address
function LocateAddress() {
    searchFlag = true;

    var thisSearchTime = lastSearchTime = (new Date()).getTime();
    activityQueryString = "";

    var address = [];
    if (!searchAddressViaPod) {
        isParkSearched = false;
        RemoveChildren(dojo.byId("tblAddressResults"));
        RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
        if (dojo.byId("txtAddress").value.trim() === "") {
            dojo.byId("txtAddress").focus();
            return;
        }
        dojo.byId("txtPodAddress").blur();
        address[locatorSettings.Locators[0].LocatorParamaters] = dojo.byId("txtAddress").value;
    } else {
        RemoveChildren(dojo.byId("tblPodAddressResults"));
        RemoveScrollBar(dojo.byId("divPodAddressScrollContainer"));
        if (dojo.byId("txtPodAddress").value.trim() === "") {
            dojo.byId("txtPodAddress").focus();
            return;
        }
        address[locatorSettings.Locators[0].LocatorParamaters] = dojo.byId("txtPodAddress").value;

    }
    var locator = new esri.tasks.Locator(locatorSettings.Locators[0].LocatorURL);
    locator.outSpatialReference = map.spatialReference;

    if (!searchAddressViaPod) {
        dojo.byId("imgSearchLoader").style.display = "block";
    } else {
        dojo.byId("imgPodSearchLoader").style.display = "block";
        dojo.byId("imgPodSearchLoader").src = loaderImg;
    }
    locator.addressToLocations(address, [locatorSettings.Locators[0].CandidateFields], function (candidates) {
        // Discard searches made obsolete by new typing from user
        if (thisSearchTime < lastSearchTime) {
            return;
        }
        ShowLocatedAddress(candidates);

        if (!searchAddressViaPod) {
            dojo.byId("imgSearchLoader").style.display = "none";
        } else {
            dojo.byId("imgPodSearchLoader").style.display = "none";
        }
    },

    function (err) {
        HideProgressIndicator();
        if (!searchAddressViaPod) {
            dojo.byId("imgSearchLoader").style.display = "none";
        } else {
            dojo.byId("imgPodSearchLoader").style.display = "none";
        }
    });
}

//Populate candidate address list in address container
function ShowLocatedAddress(candidates) {
    if (!searchAddressViaPod) {
        RemoveChildren(dojo.byId("tblAddressResults"));
        RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
        if (dojo.byId("txtAddress").value.trim() === "") {
            dojo.byId("txtAddress").focus();
            RemoveChildren(dojo.byId("tblAddressResults"));
            RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
            dojo.byId("imgSearchLoader").style.display = "none";
            return;
        }
    } else {
        RemoveChildren(dojo.byId("tblPodAddressResults"));
        RemoveScrollBar(dojo.byId("divPodAddressScrollContainer"));
        if (dojo.byId("txtPodAddress").value.trim() === "") {
            dojo.byId("txtPodAddress").focus();
            RemoveChildren(dojo.byId("tblPodAddressResults"));
            RemoveScrollBar(dojo.byId("divPodAddressScrollContainer"));
            dojo.byId("imgPodSearchLoader").style.display = "none";
            return;
        }
    }

    if (candidates.length > 0) {
        if (!searchAddressViaPod) {
            var table = dojo.byId("tblAddressResults");
        } else {
            var table = dojo.byId("tblPodAddressResults");
        }
        var tBody = document.createElement("tbody");
        table.appendChild(tBody);
        table.cellSpacing = 0;
        table.cellPadding = 0;
        var candidatesLength = 0;
        var hasValidRecords = false;

        for (var i = 0; i < candidates.length; i++) {
            var candidate = candidates[i];
            for (var bMap = 0; bMap < baseMapLayers.length; bMap++) {
                if (map.getLayer(baseMapLayers[bMap].Key).visible) {
                    var bmap = baseMapLayers[bMap].Key;
                }
            }
            if ((!map.getLayer(bmap).fullExtent.contains(candidates[i].location)) || (candidate.score < locatorSettings.Locators[0].AddressMatchScore)) {
                candidatesLength++;
            } else {
                for (j in locatorSettings.Locators[0].LocatorFieldValues) {
                    if (candidate.attributes[locatorSettings.Locators[0].LocatorFieldName] === locatorSettings.Locators[0].LocatorFieldValues[j]) {
                        var tr = document.createElement("tr");
                        tBody.appendChild(tr);
                        var td1 = document.createElement("td");
                        td1.innerHTML = dojo.string.substitute(locatorSettings.Locators[0].DisplayField, candidate.attributes);
                        td1.align = "left";
                        td1.className = "bottomborder";
                        td1.style.cursor = "pointer";
                        td1.height = 20;
                        td1.setAttribute("x", candidate.location.x);
                        td1.setAttribute("y", candidate.location.y);
                        td1.setAttribute("address", dojo.string.substitute(locatorSettings.Locators[0].DisplayField, candidate.attributes));
                        td1.onclick = function () {
                            if (!isMobileDevice) {
                                map.infoWindow.hide();
                                selectedGraphic = null;
                            }
                            mapPoint = new esri.geometry.Point(Number(this.getAttribute("x")), Number(this.getAttribute("y")), map.spatialReference);
                            if (!searchAddressViaPod) {
                                addressFlag = true;
                                dojo.byId("txtAddress").setAttribute("defaultAddress", this.innerHTML);
                                dojo.byId("txtAddress").setAttribute("defaultAddressTitle", "");
                                dojo.byId("txtAddress").style.color = "white";
                                dojo.byId("txtAddress").value = this.innerHTML;
                                lastSearchString = dojo.byId("txtAddress").value.trim();
                                LocateAddressOnMap();
                                dojo.byId("spanParkListContainer").innerHTML = "";
                            } else {
                                addressFlag = false;
                                ShowProgressIndicator();
                                dojo.byId("txtPodAddress").value = this.innerHTML;
                                lastPodSearchString = dojo.byId("txtPodAddress").value;
                                dojo.byId("txtPodAddress").setAttribute("defaultAddress", this.innerHTML);
                                dojo.byId("txtPodAddress").setAttribute("defaultAddressPodTitle", "");
                                dojo.byId("txtPodAddress").style.color = "white";
                                map.getLayer(tempGraphicsLayerId).clear();
                                var symbol = new esri.symbol.PictureMarkerSymbol(locatorSettings.DefaultLocatorSymbol, locatorSettings.MarkupSymbolSize.width, locatorSettings.MarkupSymbolSize.height);
                                var attr = {
                                    Address: dojo.byId("txtPodAddress").value
                                };
                                var graphic = new esri.Graphic(mapPoint, symbol, attr, null);
                                map.getLayer(tempGraphicsLayerId).add(graphic);
                                ConfigureRoute(mapPoint, map.getLayer(highlightPollLayerId).graphics[0].geometry);

                                HideInfoContainer();
                            }
                        };
                        tr.appendChild(td1);
                        candidatesLength++;
                        hasValidRecords = true;
                    }
                }
            }
        }
        if (!hasValidRecords) {
            var tr = document.createElement("tr");
            tBody.appendChild(tr);
            var td1 = document.createElement("td");
            td1.align = "left";
            td1.className = "bottomborder";
            td1.height = 20;
            td1.innerHTML = messages.getElementsByTagName("invalidSearch")[0].childNodes[0].nodeValue;
            tr.appendChild(td1);
        }
        SetHeightAddressResults();
        SetHeightViewDirections();
    } else {
        mapPoint = null;
        if (!searchAddressViaPod) {
            dojo.byId("imgSearchLoader").style.display = "none";
            var table = dojo.byId("tblAddressResults");
        } else {
            var table = dojo.byId("tblPodAddressResults");
            dojo.byId("imgPodSearchLoader").style.display = "none";

        }
        var tBody = document.createElement("tbody");
        table.appendChild(tBody);
        table.cellSpacing = 0;
        table.cellPadding = 0;
        var tr = document.createElement("tr");
        tBody.appendChild(tr);
        var td1 = document.createElement("td");
        td1.innerHTML = messages.getElementsByTagName("invalidSearch")[0].childNodes[0].nodeValue;
        td1.align = "left";
        td1.className = "bottomborder";
        td1.style.cursor = "default";
        td1.height = 20;
        tr.appendChild(td1);
    }
}

//Locate searched address on map with pushpin graphic
function LocateAddressOnMap() {
    map.infoWindow.hide();
    map.getLayer(tempGraphicsLayerId).clear();
    for (var bMap = 0; bMap < baseMapLayers.length; bMap++) {
        if (map.getLayer(baseMapLayers[bMap].Key).visible) {
            var bmap = baseMapLayers[bMap].Key;
        }
    }

    if (!isParkSearched) {
        if (!map.getLayer(bmap).fullExtent.contains(mapPoint)) {
            mapPoint = null;
            HideAddressContainer();
            map.getLayer(tempBufferLayer).clear();
            map.getLayer(highlightPollLayerId).clear();
            map.getLayer(routeLayerId).clear();
            WipeOutResults();
            dojo.byId("imgToggleResults").setAttribute("disable", true);
            alert(messages.getElementsByTagName("geoLocation")[0].childNodes[0].nodeValue);
            HideProgressIndicator();
            return;
        }
    }
    fromInfoWindow = false;
    DoBuffer(bufferDistance, mapPoint);
    var symbol = new esri.symbol.PictureMarkerSymbol(locatorSettings.DefaultLocatorSymbol, locatorSettings.MarkupSymbolSize.width, locatorSettings.MarkupSymbolSize.height);

    if (!searchAddressViaPod) {
        var attr = {
            Address: dojo.byId("txtAddress").value
        };
    } else {
        var attr = {
            Address: dojo.byId("txtPodAddress").value
        };
    }

    var attr = {
        Address: dojo.byId("txtAddress").value
    };
    var graphic = new esri.Graphic(mapPoint, symbol, attr, null);
    map.getLayer(tempGraphicsLayerId).add(graphic);

    if (!isMobileDevice) {

        dojo.byId("divImageBackground").style.display = "block";
    }
    HideAddressContainer();
}
//Draw the buffer
function DoBuffer(bufferDistance, mapPoint) {
    if (mapPoint && bufferDistance) {
        var params = new esri.tasks.BufferParameters();
        params.distances = [bufferDistance];
        params.unit = esri.tasks.GeometryService.UNIT_STATUTE_MILE;
        params.bufferSpatialReference = map.spatialReference;
        params.outSpatialReference = map.spatialReference;
        params.geometries = [mapPoint];
        geometryService.buffer(params, ShowBuffer);
        features = [];
    }
}

//Display the buffer
function ShowBuffer(geometries) {
    ClearBuffer();
    var lineColor = new dojo.Color();
    lineColor.setColor(rendererColor);
    var fillColor = new dojo.Color();
    fillColor.setColor(rendererColor);
    fillColor.a = 0.45;
    var bufferSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
    lineColor, 2),
    fillColor);
    AddGraphic(map.getLayer(tempBufferLayer), bufferSymbol, geometries[0]);
    map.setExtent(geometries[0].getExtent().expand(1.6));
    QueryLayer(geometries[0], mapPoint);
}

//Getting the features and their length with in the buffer region
function QueryLayer(geometry, mapPoint, isParkSearched) {
    map.getLayer(routeLayerId).clear();
    newLeft = 0;
    if (!isMobileDevice) {
        dojo.byId("divCarouselDataContent").style.left = "0px";
        ResetSlideControls();
    }
    RemoveChildren(dojo.byId("divParkList"));
    RemoveChildren(dojo.byId("divResultDataContent"));
    if (activityQueryString !== "") {
        var queryTask = new esri.tasks.QueryTask(devPlanLayerURL);
        var query = new esri.tasks.Query();
        query.outFields = ["*"];
        query.returnGeometry = true;
        query.where = activityQueryString;
        queryTask.execute(query, function (relatedRecords) {
            activityQueryString = "";
            var featureSet = new esri.tasks.FeatureSet();
            var features = [];
            for (var i in relatedRecords.features) {
                features.push(relatedRecords.features[i]);
            }
            featureSet.features = features;
            ExecuteQueryForParks(featureSet, geometry, mapPoint, isParkSearched);
        });
    } else {
        var qTask = new esri.tasks.QueryTask(devPlanLayerURL);
        var query = new esri.tasks.Query();

        if (geometry) {
            query.geometry = geometry;
            query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
            query.where = "1=1";
        } else {
            query.where = nameAttribute + " ='" + searchedPark.trim() + "'";
        }
        query.outFields = ["*"];
        query.returnGeometry = true;
        ShowProgressIndicator();
        qTask.execute(query, function (featureset) {
            if (featureset.features.length > 0) {
                dojo.byId("imgToggleResults").setAttribute("disable", false);
                ExecuteQueryForParks(featureset, geometry, mapPoint, isParkSearched);
            } else {
                HideProgressIndicator();
                alert(messages.getElementsByTagName("noParksFound")[0].childNodes[0].nodeValue);
                selectedParkID = null;
                WipeOutResults();
                dojo.byId("imgToggleResults").setAttribute("disable", true);
            }
        }, function (err) {
            HideProgressIndicator();
            alert(err.message);
            selectedParkID = null;
            WipeOutResults();
            dojo.byId("imgToggleResults").setAttribute("disable", true);
        });
    }
}

function ExecuteQueryForParks(featureset, geometry, mapPoint, isParkSearched) {
    if (!isMobileDevice) {
        WipeInResults();
    }
    var featureSet = [];
    for (var i = 0; i < featureset.features.length; i++) {
        for (var j in featureset.features[i].attributes) {
            if (!featureset.features[i].attributes[j]) {
                featureset.features[i].attributes[j] = showNullValueAs;
            }
        }
        var directions = [];
        var dist;
        if (mapPoint) {
            dist = GetDistance(mapPoint, featureset.features[i].geometry);
        }
        featureSet.push({
            facilityID: dojo.string.substitute(facilityId, featureset.features[i].attributes),
            name: dojo.string.substitute(parkName, featureset.features[i].attributes),
            address: dojo.string.substitute(infoWindowContent[0].FieldName, featureset.features[i].attributes),
            distance: dist,
            geometry: featureset.features[i].geometry,
            attributes: featureset.features[i].attributes
        });
    }
    featureSet.sort(function (a, b) {
        return parseFloat(a.distance) - parseFloat(b.distance);
    });
    if (!isMobileDevice) {
        if (dojo.byId("spanParkActivityContainer")) {
            dojo.byId("spanParkActivityContainer").style.display = "none";
        }
        if (!isParkSearched) {
            dojo.byId("spanParkListContainer").innerHTML = dojo.string.substitute(messages.getElementsByTagName("numberOfParksFoundNearAddress")[0].childNodes[0].nodeValue, [featureset.features.length]);
        } else {
            dojo.byId("spanParkListContainer").innerHTML = dojo.string.substitute(messages.getElementsByTagName("numberOfParksFoundBySearch")[0].childNodes[0].nodeValue, [featureset.features.length]);
        }

        var table = dojo.create("table", {
            "style": "width:95%; padding-left: 5px;",
            "cellspacing": "0"
        }, dojo.byId("divParkList"));
        table.style.width = "95%";
    } else {
        var table = dojo.create("table", {
            "style": "width:95%;padding-top:5px;padding-left:5px;",
            "cellspacing": "0"
        }, dojo.byId("divResultDataContent"));
    }
    var tbody = dojo.create("tbody", {}, table);

    for (var i = 0; i < featureSet.length; i++) {
        var tr = dojo.create("tr", {}, tbody);
        var td = dojo.create("td", {
            "style": "cursor:pointer;"
        }, tr);
        td.style.cursor = "pointer";
        td.setAttribute("count", i);
        td.setAttribute("address", featureSet[i].address);
        td.setAttribute("pName", featureSet[i].facilityID);

        td.className = "selectedPark";
        if (featureSet[i].distance) {
            td.innerHTML = featureSet[i].name + " (" + dojo.number.format(featureSet[i].distance.toFixed(2)) + " miles)";
        } else {
            td.innerHTML = featureSet[i].name;
        }
        td.onclick = function () {
            searchFlag = true;

            for (var i = 0; i < handlersPod.length; i++) {
                dojo.disconnect(handlersPod[i]);
            }
            handlersPod = [];
            map.infoWindow.hide();
            selectedGraphic = null;
            selectedPark = null;
            dojo.byId("tdTotalDistance").innerHTML = "";
            dojo.byId("tdTotalTime").innerHTML = "";
            RemoveChildren(dojo.byId("divDirection"));
            var point = this.getAttribute("count");
            var featureID = featureSet[point].attributes[map.getLayer(devPlanLayerID).objectIdField];
            dojo.byId("spanDirectionHeader").setAttribute("parkName", featureSet[point].name);
            defaultPark = featureSet[point];
            map.getLayer(highlightPollLayerId).clear();
            var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, locatorRippleSize, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color(rippleColor), 4), new dojo.Color([0, 0, 0, 0]));
            AddGraphic(map.getLayer(highlightPollLayerId), symbol, featureSet[point].geometry);
            dojo.query(".selectedPark", table).forEach(dojo.hitch(this, function (node, idx, arr) {
                node.style.backgroundColor = "";
            }));

            this.style.backgroundColor = "#3C4824";
            if (!isMobileDevice) {
                fromInfoWindow = false;
                selectedPark = featureSet[this.getAttribute("count")].geometry;
                if (selectedPark) {
                    if (map.getLayer(tempBufferLayer).graphics.length > 0) {
                        setTimeout(function () {
                            map.setExtent(GetBrowserMapExtent(selectedPark));
                        }, 500);
                    }
                    else {
                        map.centerAndZoom(selectedPark, locatorSettings.ZoomLevel);
                    }
                }
                RelationshipQuery(selectedPark, featureID, featureSet[point].attributes);
                dojo.byId("spanDirectionHeader").innerHTML = "Directions to " + featureSet[point].name;
                dojo.byId("spanParkInfo").innerHTML = featureSet[point].name;
                if (map.getLayer(tempGraphicsLayerId).graphics.length > 0) {
                    ShowProgressIndicator();
                    ConfigureRoute(map.getLayer(tempGraphicsLayerId).graphics[0].geometry, featureSet[point].geometry);
                } else {
                    NewAddressSearch();
                }
            } else {
                HideSearchResultContainer();
                selectedPark = featureSet[this.getAttribute("count")].geometry;
                if (mapPoint) {
                    dojo.byId("imgDirections").style.display = "block";
                    dojo.byId("divInfoDirections").style.display = "none";
                }
                RelationshipQuery(selectedPark, featureID, featureSet[point].attributes, isParkSearched);
                ShowInfoDetailsView();
                if (map.getLayer(tempBufferLayer).graphics.length > 0) {
                    dojo.byId("imgList").style.display = "block";
                }
                HideProgressIndicator();
            }

        };
    }
    map.getLayer(highlightPollLayerId).clear();
    if (geometry) {
        defaultPark = featureSet[0];
    } else {
        for (var i in featureSet) {
            if (dojo.string.substitute(parkName, featureSet[i].attributes) === dojo.byId("txtAddress").value) {
                defaultPark = featureSet[i];
            }
        }
    }

    if (!defaultPark || isParkSearched) {
        for (var i in featureSet) {
            if (dojo.string.substitute(parkName, featureSet[i].attributes) === searchedPark) {
                defaultPark = featureSet[i];
            }
        }
    }

    var featureID = defaultPark.attributes[map.getLayer(devPlanLayerID).objectIdField];
    map.getLayer(highlightPollLayerId).clear();
    dojo.byId("spanDirectionHeader").setAttribute("parkName", dojo.string.substitute(parkName, defaultPark.attributes));
    if (!isMobileDevice) {
        fromInfoWindow = false;
        RelationshipQuery(selectedPark, featureID, defaultPark.attributes);
        map.getLayer(highlightPollLayerId).clear();
        var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, locatorRippleSize, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color(rippleColor), 4), new dojo.Color([0, 0, 0, 0]));
        AddGraphic(map.getLayer(highlightPollLayerId), symbol, defaultPark.geometry);
        dojo.byId("spanDirectionHeader").innerHTML = "Directions to " + dojo.string.substitute(parkName, defaultPark.attributes);
        dojo.byId("spanParkInfo").innerHTML = dojo.string.substitute(parkName, defaultPark.attributes);
        if (mapPoint) {
            if (isBrowser) {
                ConfigureRoute(mapPoint, defaultPark.geometry);
            } else {
                if (isMobileDevice || isTablet) {
                    ConfigureRoute(mapPoint, defaultPark.geometry);
                }
            }
        } else {
            NewAddressSearch();
        }
        dojo.query("[pName = " + dojo.string.substitute(facilityId, defaultPark.attributes) + " ]", dojo.byId("divParkList"))[0].style.backgroundColor = "#3C4824";

    } else {
        fromInfoWindow = true;
        HideProgressIndicator();
        map.infoWindow.resize(225, 60);
        if (!isParkSearched) {
            selectedGraphic = mapPoint;
            var screenPoint = map.toScreen(selectedGraphic);
            screenPoint.y = map.height - screenPoint.y;
            map.infoWindow.show(screenPoint);
            map.setExtent(GetInfoWindowMobileMapExtent(mapPoint));
            map.infoWindow.setTitle(dojo.byId("txtAddress").value.trimString(18), function () {
                ShowSearchResultsContainer();
            });
            map.infoWindow.setContent("");
        } else {
            RelationshipQuery(selectedPark, featureID, defaultPark.attributes, true);
            dojo.query("[pName = " + dojo.string.substitute(facilityId, defaultPark.attributes) + " ]", dojo.byId("divResultDataContent")).forEach(function (node) {
                node.style.backgroundColor = "#3C4824";
            });
        }
        if (!isParkSearched) {
            dojo.byId("spanTitle").innerHTML = dojo.string.substitute(messages.getElementsByTagName("numberOfParksFoundNearAddress")[0].childNodes[0].nodeValue, [featureset.features.length]);
        } else {
            dojo.byId("spanTitle").innerHTML = dojo.string.substitute(messages.getElementsByTagName("numberOfParksFoundBySearch")[0].childNodes[0].nodeValue, [featureset.features.length]);
        }
    }

    CreateScrollbar(dojo.byId("divParkListContainer"), dojo.byId("divParkList"));
    CreateScrollbar(dojo.byId("divResultDataContainer"), dojo.byId("divResultDataContent"));
}

//Show the result list of parks found in the buffered area  for mobile
function ShowSearchResultsContainer() {
    dojo.byId("divInfoContainer").style.display = "none";
    dojo.byId("divResults").style.display = "block";
    dojo.replaceClass("divResultContent", "showContainer", "hideContainer");
    SetHeightSearchResults();
}

function RelationshipQuery(selectedPark, featureID, attributes, isParkSearched) {
    facilityID = dojo.string.substitute(facilityId, attributes);
    FetchComments(dojo.string.substitute(facilityId, attributes), fromInfoWindow);
    CreateParkDetails(selectedPark, attributes, isParkSearched);
}

function CreateParkDetails(selectedPark, attributes, isParkSearched) {
    if (!fromInfoWindow) {
        RemoveChildren(dojo.byId("divInformationHolder"));
        RemoveChildren(dojo.byId("divPhotoGalleryContent"));
        var table = dojo.create("table", {
            "cellspacing": "0",
            "style": "padding-left: 5px; padding-top: 5px;"
        }, dojo.byId("divInformationHolder"));
    } else {
        RemoveChildren(dojo.byId("divInfoPhotoGalleryContent"));
        RemoveChildren(dojo.byId("tblInfoDetails"));
        DisplayInfoWindow(selectedPark, attributes, isParkSearched);
        var table = dojo.byId("tblInfoDetails");
    }
    var tbody = dojo.create("tbody", {}, table);
    for (var i in attributes) {
        if (!attributes[i]) {
            attributes[i] = showNullValueAs;
        }
    }
    if (isMobileDevice || fromInfoWindow) {
        var trParkName = dojo.create("tr", {}, tbody);
        var tdParkName = dojo.create("td", {}, trParkName);
        var tblParkName = dojo.create("table", {}, tdParkName);
        tblParkName.style.width = "95%";
        tblParkName.style.borderBottom = "2px #3C4824 solid";
        var tbodyParkName = dojo.create("tbody", {}, tblParkName);
        var trPName = dojo.create("tr", {}, tbodyParkName);
        var tdPName = dojo.create("td", {
            "id": "tdPName"
        }, trPName);
        tdPName.setAttribute("parkName", dojo.string.substitute(parkName, attributes));
        tdPName.innerHTML = dojo.string.substitute(parkName, attributes);
    }

    for (var i = 0; i < infoPopupFieldsCollection.length; i++) {
        var tr = dojo.create("tr", {}, tbody);

        var td = dojo.create("td", {}, tr);
        var tbl = dojo.create("table", {
            "cellspacing": "0"
        }, td);
        tbl.className = "tdbreakword";
        tbl.style.width = "95%";
        var trData = tbl.insertRow(0);

        var tdDisplayText = dojo.create("td", {}, trData);
        var fieldValue;
        tdDisplayText.style.width = "50%";
        if (infoPopupFieldsCollection[i].DisplayText) {
            tdDisplayText.innerHTML = infoPopupFieldsCollection[i].DisplayText + " ";
        }
        else {
            tdDisplayText.innerHTML = infoPopupFieldsCollection[i].Alias + ": ";
        }
        var tdFieldName = dojo.create("td", {}, trData);

        fieldValue = dojo.string.substitute(infoPopupFieldsCollection[i].FieldName, attributes);
        if ((fieldValue) && (fieldValue !== "-")) {
            tdFieldName.innerHTML = fieldValue;
        }
        if ((fieldValue) && (fieldValue !== "-")) {
            if (CheckMailFormat(fieldValue)) {
                tdFieldName.innerHTML = "";
                var mail = document.createElement("u");
                mail.style.cursor = "pointer";
                mail.innerHTML = infoPopupFieldsCollection[i].FieldName;
                mail.setAttribute("email", fieldValue);
                mail.style.wordBreak = "break-all";
                mail.onclick = function () {
                    parent.location = "mailto:" + this.getAttribute("email");
                };
                tdFieldName.appendChild(mail);
            } else if (fieldValue.match("http:" || "https:")) {
                tdFieldName.innerHTML = "";
                var link = document.createElement("u");
                link.style.cursor = "pointer";
                link.innerHTML = "More info";
                link.setAttribute("link", fieldValue);
                link.style.wordBreak = "break-all";
                link.onclick = function () {
                    window.open(this.getAttribute("link"));
                };
                tdFieldName.appendChild(link);
                tdFieldName.style.wordBreak = "break-all";
            }
        }
    }
    if (isMobileDevice || fromInfoWindow) {
        var tablePhoto = dojo.create("table", {
            "style": "width:100%;height:100%;",
            "id": "tblPhoto"
        }, dojo.byId("divInfoPhotoGalleryContent"));
    } else {
        var tablePhoto = dojo.create("table", {
            "style": "width:100%;height:100%;",
            "id": "tblPhotoPod"
        }, dojo.byId("divPhotoGalleryContent"));
    }
    var tbodyPhoto = dojo.create("tbody", {}, tablePhoto);
    var trPhoto = dojo.create("tr", {}, tbodyPhoto);
    var tdPhoto = dojo.create("td", {
        "style": "vertical-align:top;"
    }, trPhoto);
    var divPhoto = dojo.create("div", {}, tdPhoto);
    if (!fromInfoWindow) {
        divPhoto.style.width = infoBoxWidth - 20 + "px";
        divPhoto.id = "divPhotoPod";
    } else {
        divPhoto.id = "divPhoto";
        if (isMobileDevice) {
            divPhoto.style.width = (dojo.window.getBox().w - 20) + "px";
        } else {
            divPhoto.style.width = infoWindowWidth - 20 + "px";
        }
    }

    var imgGallery;
    map.getLayer(devPlanLayerID).queryAttachmentInfos(attributes[map.getLayer(devPlanLayerID).objectIdField], function (attachment) {
        var tdImagePhoto = dojo.create("td", {
            "align": "right"
        }, trPName);
        imgGallery = dojo.create("img", {
            "class": "imgOptions",
            "src": "images/gallery.png"
        }, tdImagePhoto);
        imgGallery.id = "mblInfoGallery";
        imgGallery.title = "Gallery";
        imgGallery.style.display = "block";

        if (fromInfoWindow) {
            imgGallery.onclick = function () {
                ShowPhotoGalleryView();
            };
        }

        if (attachment.length > 0) {
            var trAttachemnt = dojo.create("tr", {}, tbody);
            var tdAttachment = dojo.create("td", {}, trAttachemnt);
            var tblAttachment = dojo.create("table", {
                "cellspacing": "0"
            }, tdAttachment);
            tblAttachment.style.width = "95%";
            var tbodyAttachment = dojo.create("tbody", {}, tblAttachment);
            var trAttachmentText = dojo.create("tr", {}, tbodyAttachment);
            imgArray = [];
            imgFiles = [];
            var counterPdf = 0;
            var counterImg = 0;

            attachment.sort(function (a, b) {
                return a.id - b.id;
            });

            for (var k = 0; k < attachment.length; k++) {

                if (attachment[k].contentType.indexOf("pdf") >= 0) {
                    var tdAttachmentText = dojo.create("td", {}, trAttachmentText);
                    tdAttachmentText.innerHTML = "Attachment : ";
                    tdAttachmentText.style.width = "50%";
                    var tdAttachmentFile = dojo.create("td", {}, trAttachmentText);
                    tdAttachmentFile.style.textDecoration = "underline";
                    tdAttachmentFile.style.cursor = "pointer";
                    tdAttachmentFile.innerHTML = "View";
                    tdAttachmentFile.setAttribute("url", attachment[k].url);
                    tdAttachmentFile.setAttribute("url", attachment[k].url);
                    tdAttachmentFile.onclick = function () {
                        window.open(this.getAttribute("url"));
                    };
                    counterPdf++;
                } else {

                    if (fromInfoWindow || isMobileDevice) {
                        imgFiles.push(attachment[k].url);
                    } else {
                        imgArray.push(attachment[k].url);
                    }

                    if (!fromInfoWindow) {
                        ResetSlideControls();
                    }
                    AddImage(k, counterPdf, attachment[k].url, divPhoto, attachment.length);
                }

            }
        } else if (!fromInfoWindow) {
            dojo.byId("divPhotoPod").innerHTML = messages.getElementsByTagName("noPhotosAvailable")[0].childNodes[0].nodeValue;
        } else {
            divPhoto.innerHTML = messages.getElementsByTagName("noPhotosAvailable")[0].childNodes[0].nodeValue;
        }
        var trActivity = dojo.create("tr", {}, tbody);
        var tdActivity = dojo.create("td", {
            "colspan": "2"
        }, trActivity);
        var tblActivity = dojo.create("table", {}, tdActivity);
        var tbodyActivity = dojo.create("tbody", {}, tblActivity);
        var trImg = dojo.create("tr", {}, tbodyActivity);

        var td1 = dojo.create("td", {}, trImg);
        var div = dojo.create("div", {
            "id": "divActivity"
        }, td1);

        if (!fromInfoWindow) {
            div.style.width = infoBoxWidth - 20 + "px";
        } else {
            if (isMobileDevice) {
                div.style.width = (dojo.window.getBox().w - 50) + "px";
            } else {
                div.style.width = infoWindowWidth - 20 + "px";
            }
        }

        for (var j = 0; j < infoActivity.length; j++) {

            if (dojo.string.substitute(infoActivity[j].FieldName, attributes) === "Yes") {

                var imgActivity = dojo.create("img", {
                    "src": infoActivity[j].Image,
                    "style": "padding:2px;",
                    "class": "imgOptions",
                    "title": infoActivity[j].Alias
                }, div);
                imgActivity.style.padding = "2px 5px 5px 0px";
                imgActivity.style.cursor = "default";

            }
        }
        CreateScrollbar(dojo.byId("divInformationContainer"), dojo.byId("divInformationHolder"));
        CreateScrollbar(dojo.byId("divPhotoGalleryContentHolder"), dojo.byId("divPhotoGalleryContent"));
        SetHeightGalleryDetails();
        SetHeightViewDetails();
    }, function (err) {
        HideProgressIndicator();
        alert(err.message);
    });
}

//Add attachments coming from the layers
function AddImage(index, pdfCount, imageURL, divPhoto, totalImages) {
    var imgGallery = dojo.create("img", {
        "src": loadingAttachmentsImg
    }, divPhoto);
    imgGallery.style.height = "60px";
    imgGallery.style.width = "60px";
    imgGallery.style.padding = "5px";
    var dummyImage = dojo.create("img", {
        "src": imageURL
    }, null);
    dummyImage.onload = function () {
        imgGallery.src = imageURL;
        imgGallery.style.cursor = "pointer";
    };
    imgGallery.setAttribute("index", (index - pdfCount));
    imgGallery.setAttribute("totalImages", totalImages);
    imgGallery.onclick = function (evt) {
        if (imgGallery.src === imageURL) {
            ShowImages(this);
        }
    };
}

//Calculate distance between two mapPoints
function GetDistance(startPoint, endPoint) {
    var sPoint = esri.geometry.webMercatorToGeographic(startPoint);
    var ePoint = esri.geometry.webMercatorToGeographic(endPoint);
    var lon1 = sPoint.x;
    var lat1 = sPoint.y;
    var lon2 = ePoint.x;
    var lat2 = ePoint.y;
    var theta = lon1 - lon2;
    var dist = Math.sin(Deg2Rad(lat1)) * Math.sin(Deg2Rad(lat2)) + Math.cos(Deg2Rad(lat1)) * Math.cos(Deg2Rad(lat2)) * Math.cos(Deg2Rad(theta));
    dist = Math.acos(dist);
    dist = Rad2Deg(dist);
    dist = dist * 60 * 1.1515;
    return (dist * 10) / 10;
}

//Convert the degrees to radians
function Deg2Rad(deg) {
    return (deg * Math.PI) / 180.0;
}

//Convert the radians to degrees
function Rad2Deg(rad) {
    return (rad / Math.PI) * 180.0;
}

//Clear the buffer graphics
function ClearBuffer() {
    var layer = map.getLayer(tempBufferLayer);
    if (layer) {
        var count = layer.graphics.length;
        for (var i = 0; i < count; i++) {
            var graphic = layer.graphics[i];
            if (graphic.geometry.type === "polygon") {
                layer.remove(graphic);
            }
        }
    }
}

//Get the extent based on the map-point
function GetExtent(point) {
    var xmin = point.x;
    var ymin = (point.y) - 30;
    var xmax = point.x;
    var ymax = point.y;
    return new esri.geometry.Extent(xmin, ymin, xmax, ymax, map.spatialReference);
}

//Locate park by name
function LocateParkbyName() {
    searchFlag = true;
    addressFlag = false;

    if (isBrowser && !getDirectionsDesktop) {
        dojo.byId("tdDirectionsPod").style.display = "block";
    } else if (isTablet && !getDirectionsMobile) {
        dojo.byId("tdDirectionsPod").style.display = "block";
    }


    var thisSearchTime = lastSearchTime = (new Date()).getTime();
    activityQueryString = "";
    mapPoint = null;
    RemoveChildren(dojo.byId("tblAddressResults"));
    RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
    if (dojo.byId("txtAddress").value.trim() === "") {
        dojo.byId("imgSearchLoader").style.display = "none";
        dojo.byId("txtAddress").focus();
        return;
    }
    var qTask = new esri.tasks.QueryTask(devPlanLayerURL);
    var query = new esri.tasks.Query();
    query.where = "UPPER" + "(" + nameAttribute + ")" + " LIKE '%" + dojo.byId("txtAddress").value.trim().toUpperCase() + "%'";
    query.outFields = ["*"];
    query.returnGeometry = true;
    dojo.byId("imgSearchLoader").style.display = "block";
    qTask.execute(query, function (featureset) {
        if (thisSearchTime < lastSearchTime) {
            return;
        }
        if (resultFound) {
            dojo.byId("imgSearchLoader").style.display = "none";
            return;
        }
        RemoveChildren(dojo.byId("tblAddressResults"));
        RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
        if (dojo.byId("txtAddress").value.trim() === "") {
            dojo.byId("txtAddress").focus();
            RemoveChildren(dojo.byId("tblAddressResults"));
            RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
            return;
        }
        dojo.byId("imgSearchLoader").style.display = "none";
        if (featureset.features.length > 0) {
            if (featureset.features.length === 1) {
                resultFound = true;
                dojo.byId("txtAddress").blur();
                RemoveChildren(dojo.byId("divParkList"));
                map.getLayer(routeLayerId).clear();
                for (var i = 0; i < handlersPod.length; i++) {
                    dojo.disconnect(handlersPod[i]);
                }
                handlersPod = [];

                map.infoWindow.hide();
                selectedGraphic = null;
                selectedPark = null;
                dojo.byId("txtAddress").value = dojo.string.substitute(parkName, featureset.features[0].attributes);
                dojo.byId("txtAddress").setAttribute("defaultParkName", dojo.string.substitute(parkName, featureset.features[0].attributes));
                dojo.byId("txtAddress").setAttribute("defaultParkTitle", "");
                dojo.byId("txtAddress").style.color = "white";
                searchedPark = dojo.byId("txtAddress").value;

                selectedPark = featureset.features[0].geometry;
                LocateParkOnMap();
            } else {
                var table = dojo.byId("tblAddressResults");
                var tBody = document.createElement("tbody");
                table.appendChild(tBody);
                table.cellSpacing = 0;
                table.cellPadding = 0;
                var featureSet = [];
                for (var i = 0; i < featureset.features.length; i++) {
                    featureSet.push({
                        name: dojo.string.substitute(parkName, featureset.features[i].attributes),
                        geometry: featureset.features[i].geometry,
                        attributes: featureset.features[i].attributes
                    });
                }

                featureSet.sort(function (a, b) {
                    var nameA = a.name.toLowerCase(),
                        nameB = b.name.toLowerCase();
                    if (nameA < nameB) //sort string ascending
                    {
                        return -1
                    } else {
                        return 1
                    }
                });

                for (var i = 0; i < featureSet.length; i++) {
                    var park = featureSet[i];
                    var tr = document.createElement("tr");
                    tBody.appendChild(tr);
                    var td1 = document.createElement("td");
                    td1.innerHTML = dojo.string.substitute(parkName, park.attributes);
                    td1.align = "left";
                    td1.className = "bottomborder";
                    td1.style.cursor = "pointer";
                    td1.height = 20;
                    td1.setAttribute("x", park.geometry.x);
                    td1.setAttribute("y", park.geometry.y);
                    td1.setAttribute("name", dojo.string.substitute(parkName, park.attributes));
                    td1.onclick = function () {
                        map.getLayer(routeLayerId).clear();
                        RemoveChildren(dojo.byId("divParkList"));
                        for (var i = 0; i < handlersPod.length; i++) {
                            dojo.disconnect(handlersPod[i]);
                        }
                        handlersPod = [];

                        map.infoWindow.hide();
                        selectedGraphic = null;
                        selectedPark = null;

                        dojo.byId("txtAddress").value = this.innerHTML;
                        dojo.byId("txtAddress").setAttribute("defaultParkName", this.innerHTML);
                        dojo.byId("txtAddress").setAttribute("defaultParkTitle", "");
                        dojo.byId("txtAddress").style.color = "white";
                        searchedPark = dojo.byId("txtAddress").value;

                        selectedPark = new esri.geometry.Point(Number(this.getAttribute("x")), Number(this.getAttribute("y")), map.spatialReference);
                        LocateParkOnMap();
                    };
                    tr.appendChild(td1);
                }
                SetHeightAddressResults();
            }

        } else {
            isParkSearched = true;
            ErrorHandlerForParks();
        }
    }, function (err) {
        isParkSearched = true;
        ErrorHandlerForParks();
    });
}

function ErrorHandlerForParks() {
    selectedPark = null;
    dojo.byId("imgSearchLoader").style.display = "none";

    if (dojo.byId("tdSearchPark").className === "tdSearchByPark") {
        var table = dojo.byId("tblAddressResults");
    }
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    table.cellSpacing = 0;
    table.cellPadding = 0;
    var tr = document.createElement("tr");
    tBody.appendChild(tr);
    var td1 = document.createElement("td");
    if (!isParkSearched) {
        td1.innerHTML = messages.getElementsByTagName("invalidSearch")[0].childNodes[0].nodeValue;
    } else {
        td1.innerHTML = messages.getElementsByTagName("noParks")[0].childNodes[0].nodeValue;
    }
    td1.align = "left";
    td1.className = "bottomborder";
    td1.style.cursor = "default";
    td1.height = 20;
    tr.appendChild(td1);
}

function LocateParkOnMap() {
    map.infoWindow.hide();
    map.getLayer(tempGraphicsLayerId).clear();
    map.getLayer(tempBufferLayer).clear();
    isParkSearched = true;
    map.getLayer(highlightPollLayerId).clear();
    var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, locatorRippleSize, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color(rippleColor), 4), new dojo.Color([0, 0, 0, 0]));
    AddGraphic(map.getLayer(highlightPollLayerId), symbol, selectedPark);
    if (getDirections) {
        if (!isBrowser) {
            if (getDirectionsMobile) {
                ShowMyLocation();
            } else {
                if (isParkSearched) {
                    QueryLayer(null, null, true);
                    if (!isMobileDevice) {
                        map.centerAndZoom(selectedPark, locatorSettings.ZoomLevel);
                    }
                    isParkSearched = false;
                }
            }

        } else {
            if (getDirectionsDesktop) {
                ShowMyLocation();
            } else {
                if (isParkSearched) {
                    QueryLayer(null, null, true);
                    if (!isMobileDevice) {
                        map.centerAndZoom(selectedPark, locatorSettings.ZoomLevel);
                    }
                    isParkSearched = false;
                }
            }
        }
    } else {
        if (!isMobileDevice) {
            if (selectedPark) {
                map.centerAndZoom(selectedPark, locatorSettings.ZoomLevel);
            }
            if (dojo.coords("divAddressHolder").h > 0) {
                dojo.replaceClass("divAddressHolder", "hideContainerHeight", "showContainerHeight");
                dojo.byId("divAddressHolder").style.height = "0px";
            }
        }
        if (isParkSearched) {
            QueryLayer(null, null, true);
        }
    }
    if (isMobileDevice) {
        HideAddressContainer();
    }
}

//Display the view to search by park name
function ShowParkSearchView() {
    if (dojo.byId("imgSearchLoader").style.display === "block") {
        return;
    }
    dojo.byId("txtAddress").style.color = "gray";
    dojo.byId("txtAddress").value = dojo.byId("txtAddress").getAttribute("defaultParkName");
    lastSearchString = dojo.byId("txtAddress").value.trim();
    RemoveChildren(dojo.byId("tblAddressResults"));
    RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
    dojo.byId("tdSearchAddress").className = "tdSearchByUnSelectedAddress";
    dojo.byId("tdSearchPark").className = "tdSearchByPark";
    dojo.byId("tdSearchActivity").className = "tdSearchByUnSelectedActivity";
    dojo.byId("tdActivitySearch").style.display = "none";
    dojo.byId("tdAddressSearch").style.display = "block";
}

//Display the view to search by address
function ShowAddressSearchView() {
    if (dojo.byId("imgSearchLoader").style.display === "block") {
        return;
    }
    dojo.byId("txtAddress").style.color = "gray";
    dojo.byId("txtAddress").value = dojo.byId("txtAddress").getAttribute("defaultAddress");
    lastSearchString = dojo.byId("txtAddress").value.trim();
    RemoveChildren(dojo.byId("tblAddressResults"));
    RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
    dojo.byId("tdSearchAddress").className = "tdSearchByAddress";
    dojo.byId("tdSearchPark").className = "tdSearchByUnSelectedPark";
    dojo.byId("tdSearchActivity").className = "tdSearchByUnSelectedActivity";
    dojo.byId("tdActivitySearch").style.display = "none";
    dojo.byId("tdAddressSearch").style.display = "block";
}

//Display the view to search by Activity
function ShowActivitySearchView() {
    if (dojo.byId("imgSearchLoader").style.display === "block") {
        return;
    }
    dojo.byId("txtAddress").style.color = "gray";
    if (dojo.byId("tableActivityList").rows.length === 0) {
        var activityArray = [];
        for (var i in infoActivity) {
            var temp = infoActivity[i];

            var activityName;
            infoActivity[i].FieldName.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function (match, key) {
                activityName = key;
            });

            temp.AttributeName = activityName;
            activityArray.push(infoActivity[i]);
        }
        for (var i = 0; i < (activityArray.length / 2); i++) {
            var tr = dojo.byId("tableActivityList").insertRow(i);
            var td1 = tr.insertCell(0);

            td1.style.width = "50%";
            CreateActivityCell(td1, activityArray[i * 2], i * 2);

            var td2 = tr.insertCell(1);
            td2.style.width = "50%";
            CreateActivityCell(td2, activityArray[(i * 2) + 1], (i * 2) + 1);
        }
    } else {
        for (var i in infoActivity) {
            if (infoActivity[i].isSelected) {
                dojo.replaceClass(dojo.byId("imgActivity" + infoActivity[i].AttributeName), "selectedActivity", "imgOptions");
            } else {
                dojo.replaceClass(dojo.byId("imgActivity" + infoActivity[i].AttributeName), "imgOptions", "selectedActivity");
            }
        }
    }
    dojo.byId("tdSearchAddress").className = "tdSearchByUnSelectedAddress";
    dojo.byId("tdSearchPark").className = "tdSearchByUnSelectedPark";
    dojo.byId("tdSearchActivity").className = "tdSearchByActivity";
    dojo.byId("tdAddressSearch").style.display = "none";
    dojo.byId("tdActivitySearch").style.display = "block";
    SetHeightActivityView();
}

//display the available activities in the activity search container
function CreateActivityCell(td, activity, index) {
    if (activity) {
        var table = dojo.create("table", {}, td);
        table.style.width = "90%";
        var tbody = dojo.create("tbody", {}, table);
        var tr = dojo.create("tr", {}, tbody);
        var td = dojo.create("td", {}, tr);
        td.align = "left";
        if (isBrowser) {
            td.style.width = "40px";
            td.style.height = "40px";
        } else {
            td.style.width = "55px";
            td.style.height = "55px";
        }
        var tdText = dojo.create("td", {
            "style": "cursor:pointer;"
        }, tr);
        tdText.style.cursor = "pointer";
        tdText.align = "left";
        var img = dojo.create("img", {
            "src": activity.Image,
            "style": "cursor:pointer;border:3px solid transparent",
            "className": "imgOptions"
        }, td);
        img.id = "imgActivity" + activity.AttributeName;
        img.setAttribute("index", index);
        img.setAttribute("activity", activity.AttributeName);
        if (activity.isSelected) {
            img.className = "selectedActivity";
        }
        tdText.innerHTML = activity.Alias;

        tr.onclick = function () {
            if (dojo.hasClass(img, "selectedActivity")) {
                dojo.replaceClass(img, "imgOptions", "selectedActivity");
            } else {
                dojo.replaceClass(img, "selectedActivity", "imgOptions");
            }
        };
    }
}

//Get park results for searched activities
function LocateParkbyActivity() {
    searchFlag = true;
    addressFlag = false;
    mapPoint = null;

    if (isBrowser && !getDirectionsDesktop) {
        dojo.byId("tdDirectionsPod").style.display = "block";
    } else if (isTablet && !getDirectionsMobile) {
        dojo.byId("tdDirectionsPod").style.display = "block";
    }

    activityQueryString = "";
    dojo.query(".selectedActivity", dojo.byId("tableActivityList")).forEach(function (node) {
        var activity = node.getAttribute("activity");
        activityQueryString += activity + " = 'Yes' AND ";
    });

    if (activityQueryString === "") {
        alert(messages.getElementsByTagName("selectActivities")[0].childNodes[0].nodeValue);
        return;
    }
    activityQueryString += "1=1";
    var queryTask = new esri.tasks.QueryTask(devPlanLayerURL);
    var query = new esri.tasks.Query();
    query.where = activityQueryString;
    query.outFields = [nameAttribute];
    query.returnGeometry = true;
    ShowProgressIndicator();
    queryTask.execute(query, function (relatedRecords) {
        var objectIds = relatedRecords.features;
        if (objectIds.length > 0) {
            HideProgressIndicator();
            if (objectIds.length === 1) {
                map.getLayer(routeLayerId).clear();
                dojo.query(".selectedActivity", dojo.byId("tableActivityList")).forEach(function (node) {
                    var activity = node.getAttribute("index");
                    infoActivity[activity].isSelected = true;
                });

                dojo.query(".imgOptions", dojo.byId("tableActivityList")).forEach(function (node) {
                    var activity = node.getAttribute("index");
                    infoActivity[activity].isSelected = false;
                });
                map.infoWindow.hide();
                selectedGraphic = null;
                selectedPark = null;
                isParkSearched = true;
                selectedPark = relatedRecords.features[0].geometry;
                searchedPark = dojo.string.substitute(parkName, relatedRecords.features[0].attributes);
                LocateParkOnMap();
                ShowActivitySearchView();
            } else {
                var featureSet = [];
                for (var i = 0; i < objectIds.length; i++) {
                    featureSet.push({
                        name: dojo.string.substitute(parkName, relatedRecords.features[i].attributes),
                        geometry: relatedRecords.features[i].geometry,
                        attributes: relatedRecords.features[i].attributes
                    });
                }
                map.getLayer(routeLayerId).clear();
                dojo.query(".selectedActivity", dojo.byId("tableActivityList")).forEach(function (node) {
                    var activity = node.getAttribute("index");
                    infoActivity[activity].isSelected = true;
                });

                dojo.query(".imgOptions", dojo.byId("tableActivityList")).forEach(function (node) {
                    var activity = node.getAttribute("index");
                    infoActivity[activity].isSelected = false;
                });
                map.infoWindow.hide();
                selectedGraphic = null;
                selectedPark = null;
                isParkSearched = true;
                selectedPark = featureSet[0].geometry;
                searchedPark = dojo.string.substitute(parkName, featureSet[0].attributes);
                LocateParkOnMap();
                ShowActivitySearchView();
            }
        } else {
            HideProgressIndicator();
            isParkSearched = true;
            selectedPark = null;
            dojo.byId("imgSearchLoader").style.display = "none";
            alert(messages.getElementsByTagName("invalidSearch")[0].childNodes[0].nodeValue);
        }
    });
}
