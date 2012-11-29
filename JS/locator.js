/*
 | Version 10.1.1
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
var activityCount; //variable for storing the count of activities list
var distance; //variable for storing the distances between points
var features = []; //Array for storing the features that are in the buffer region
var mapPoint; //variable for storing map point location
var parkCount; //variable for storing the count of parks list
var pollPoint; //varible for storing the selected park geometry

//Function to locate the entered address on the map
function Locate(evt) {
    if (!(dojo.byId('txtAddress').disabled)) {
        if (dojo.byId('spanAddress').className == 'text') {
            if (dojo.byId("txtAddress").value.trim() == "") {
                dojo.byId('txtAddress').value = '';
                dojo.byId('txtAddress').focus();
                ShowDialog('Locator Error', messages.getElementsByTagName("addressToLocate")[0].childNodes[0].nodeValue);
                return;
            }
            GeoCodeAddress(evt);
        }
        else {
            if (dojo.byId("txtAddress").value.trim() == '' || dojo.byId("txtAddress").value == dojo.byId('txtAddress').title) {
                dojo.byId('txtAddress').value = '';
                dojo.byId('txtAddress').focus();
                ShowDialog('Locator Error', messages.getElementsByTagName("activityToLocate")[0].childNodes[0].nodeValue);
                return;
            }
            if (dojo.byId("txtAddress").value.trim() != "") {
                var findParams;
                findParams = new esri.tasks.FindParameters();
                findParams.returnGeometry = true;
                findParams.layerIds = [0];
                findParams.searchFields = searchFields;
                findParams.outSpatialReference = map.spatialReference;
                findParams.searchText = dojo.byId('txtAddress').value;
                findTask.execute(findParams, PopulateSearchItem, function (err) {
                    HideLoadingMessage();
                    ShowDialog('Error', err.message);
                });
                ShowLoadingMessage('Searching...');
            }
            else {
                ShowDialog('Error', messages.getElementsByTagName("activityToLocate")[0].childNodes[0].nodeValue);
            }
        }
    }
}

//function to populate all the parks with the matching name
function PopulateSearchItem(featureSet) {
    layer = false;
    RemoveChildren(dojo.byId('divAddressContainer'));
    var DislayField = [];
    var features = featureSet;
    if (dojo.byId('divParkActivity')) {
        RemoveChildren(dojo.byId('divParkActivity'));
    }
    dojo.byId('divParkActivityContainer').style.display = 'block';
    dojo.byId('divParkListContainer').style.display = 'none';
    dojo.byId('divParkActivityContainer').style.height = '85px';
    dojo.byId('divParkActivityContainer').style.borderBottom = '#F5F5DC 1px solid';
    dojo.byId('divParkActivityContainer').style.marginBottom = '10px';
    dojo.byId('divParkActivity').style.height = "60px";
    dojo.byId('spanParkActivityContainer').style.display = 'block';
    dojo.byId('spanParkActivityContainer').innerHTML = "Found " + featureSet.length + " park(s) with matching name";
    parkCount = featureSet.length;
    if (features.length > 0) {

        var coords = dojo.coords('divAddress');
        var span = dojo.byId('divAddressContainer');
        dojo.style(span, {
            left: coords.x + "px",
            top: parseInt(coords.h) + parseInt(coords.y) + "px"
        });

        for (var i = 0; i < featureSet.length; i++) {
            if (featureSet[i].foundFieldName == infoWindowHeader[0].Alias) {
                DislayField[i] = infoWindowHeader[0].Alias;
            }
        }
        var table = document.createElement("table");
        var tBody = document.createElement("tbody");
        table.appendChild(tBody);
        table.id = "tbl";
        table.style.width = "90%"
        table.cellSpacing = 0;
        table.cellPadding = 0;
        for (var i = 0; i < features.length; i++) {
            var tr = document.createElement("tr");
            tBody.appendChild(tr);
            var td1 = document.createElement("td");
            td1.innerHTML = featureSet[i].feature.attributes[DislayField[i]];
            td1.className = 'tdAddress';
            td1.height = 20;
            td1.style.paddingLeft = '10px';
            td1.id = 'park' + i;
            td1.setAttribute("count", i);
            if (i == 0) {
                td1.style.backgroundColor = "#3C4824";
            }
            td1.onclick = function (evt) {
                var str = this.id;
                var str = this.id;
                var stri = str.split('k');
                var ss = stri[1];
                map.graphics.clear();
                map.getLayer(highlightPollLayerId).clear();
                FindTaskResults(featureSet[ss]);
                for (var p = 0; p < parkCount; p++) {
                    if (dojo.byId('park' + p)) {
                        dojo.byId('park' + p).style.backgroundColor = "";
                    }
                }
                for (var q = 0; q < activityCount; q++) {
                    if (dojo.byId('activity' + q)) {
                        dojo.byId('activity' + q).style.backgroundColor = "";
                    }
                }
                this.style.backgroundColor = "#3C4824";
                newLeftOffice = 0;
                CreateParkDetails(this, features);
                CreateParkDirections(this, features);
                if (mapPoint) {
                    ConfigureRoute(mapPoint);
                }
            }
            tr.appendChild(td1);
        }
        dojo.byId('divParkActivity').appendChild(table);
        if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
            WipeOutControl(dojo.byId('divAddressContainer'), 100);
        }
        CreateScrollbar(dojo.byId('divParkActivityContainer'), dojo.byId('divParkActivity'));
        dojo.byId('divParkActivityContainerscrollbar_track').style.top = '20px';
        dojo.byId('divParkActivityContainerscrollbar_track').style.right = '20px';
        RemoveChildren(dojo.byId('divParkDetails'));
        RemoveChildren(dojo.byId('divParkDirections'));
        ClearAll();
        FindTaskResults(featureSet[0]);
        newLeftOffice = 0;
        CreateParkDetails(null, features);
        CreateParkDirections(null, features);
    }
    else {
        featureID = '';
        ClearAll();
        RemoveChildren(dojo.byId('divParkDetails'));
        RemoveChildren(dojo.byId('divParkDirections'));
        CreateScrollbar(dojo.byId('divParkActivityContainer'), dojo.byId('divParkActivity'));
    }
    CreateActivityList();
    HideLoadingMessage();
    var node = dojo.byId('divLeftPanelBackground');
    if (dojo.coords(node).l != 0) {
        AnimateDetailsView();
    }
}

//function for locating selected park or activity
function FindTaskResults(results) {
    map.graphics.clear();
    map.infoWindow.hide();
    for (var i in map.getLayer(devPlanLayerID).fields) {
        if (map.getLayer(devPlanLayerID).objectIdField == map.getLayer(devPlanLayerID).fields[i].name) {
            var objectId = map.getLayer(devPlanLayerID).fields[i].alias;
        }
        if (infoWindowHeader[0].FieldName == map.getLayer(devPlanLayerID).fields[i].name) {
            var facilityName = map.getLayer(devPlanLayerID).fields[i].alias;
            break;
        }
    }
    if (results.feature.attributes[objectId].toLowerCase() != 'null') {
        featureID = results.feature.attributes[objectId];
    }
    else {
    var query = new esri.tasks.Query;
    query.outSpatialReference = map.spatialReference;
    query.where = infoWindowHeader[0].FieldName + "= '" + results.feature.attributes[facilityName] + "'";
        queryTask.executeForIds(query, function (fset) {
          featureID=  fset[0];
        });
    }
    if (!mapPoint) {
        map.centerAndZoom(results.feature.geometry, map._slider.maximum - 2);
    }
    HideRipple();
    GlowRipple(results.feature.geometry);
}

//function for displaying the activities with their matching name
function CreateActivityList() {
    dojo.byId('divActivityListContainer').style.display = 'block';
    dojo.byId('divActivityListContainer').style.height = '85px';
    dojo.byId('divActivityListContainer').style.borderBottom = '#F5F5DC 1px solid';
    dojo.byId('divActivityList').style.height = "60px";
    dojo.byId('divActivityListContainer').style.marginBottom = '8px';
    RemoveChildren(dojo.byId('divActivityList'));
    var fieldSearch = [];
    var l = 0;
    for (var t = 0; t < infoActivity.length; t++) {
        var search = infoActivity[t].SearchKey.split(",");
        for (var y = 0; y < search.length; y++) {
            if (search[y].toLowerCase() == (dojo.byId('txtAddress').value).toLowerCase()) {
                fieldSearch[l] = infoActivity[t].FieldName;
                l++;
            }
        }
    }
    if (fieldSearch.length == 0) {
        dojo.byId('spanActivityListContainer').innerHTML = 'Found ' + fieldSearch.length + ' park(s) with matching activity';
        CreateScrollbar(dojo.byId('divActivityListContainer'), dojo.byId('divActivityList'));
    }
    else {
        var activitySearch = '';
        if (fieldSearch.length > 1) {
            for (var a = 0; a < fieldSearch.length; a++) {
                if (a != (fieldSearch.length - 1)) {
                    activitySearch += ' ' + fieldSearch[a] + "=" + "'Yes' or";
                }
                else {
                    activitySearch += ' ' + fieldSearch[a] + "=" + "'Yes'";
                }
            }
        }
        else {
            activitySearch += ' ' + fieldSearch[0] + "=" + "'Yes'";
        }
    }
    if (fieldSearch.length != 0) {
        var aTask = 'aTask';
        aTask = new esri.tasks.QueryTask(devPlanLayerURL);
        var query = new esri.tasks.Query();
        query.where = activitySearch;
        query.outFields = ["*"];
        query.outSpatialReference = map.spatialReference;
        query.returnGeometry = true;

        aTask.execute(query, function (featureSet) {
            dojo.byId('spanActivityListContainer').innerHTML = 'Found ' + featureSet.features.length + ' park(s) with matching activity';
            activityCount = featureSet.features.length;
            if (featureSet.features.length > 0) {

                var coords = dojo.coords('divAddress');
                var span = dojo.byId('divAddressContainer');
                dojo.style(span, {
                    left: coords.x + "px",
                    top: parseInt(coords.h) + parseInt(coords.y) + "px"
                });

                var table = document.createElement("table");
                var tBody = document.createElement("tbody");
                table.appendChild(tBody);
                table.id = "tblActivity";
                table.style.width = "90%"
                table.cellSpacing = 0;
                table.cellPadding = 0;
                for (var i = 0; i < featureSet.features.length; i++) {
                    var tr = document.createElement("tr");
                    tBody.appendChild(tr);
                    var td1 = document.createElement("td");
                    td1.innerHTML = featureSet.features[i].attributes[infoWindowHeader[0].FieldName];
                    td1.className = 'tdAddress';
                    td1.height = 20;
                    td1.id = 'activity' + i;
                    td1.style.paddingLeft = '10px';
                    if (parkCount == 0) {
                        if (i == 0) {
                            td1.style.backgroundColor = "#3C4824";
                        }
                    }
                    td1.setAttribute("count", i);
                    map.infoWindow.hide();
                    td1.onclick = function (evt) {
                        map.getLayer(highlightPollLayerId).clear();
                        map.infoWindow.hide();
                        var str = this.id;
                        var stri = str.split('y');
                        var ss = stri[1];
                        for (var l = 0; l < activityCount; l++) {
                            if (dojo.byId('activity' + l)) {
                                dojo.byId('activity' + l).style.backgroundColor = "";
                            }
                        }
                        for (var k = 0; k < parkCount; k++) {
                            if (dojo.byId('park' + k)) {
                                dojo.byId('park' + k).style.backgroundColor = "";
                            }
                        }
                        this.style.backgroundColor = "#3C4824";
                        map.graphics.clear();
                        var highlightPoint = featureSet.features[ss].geometry;
                        featureID = featureSet.features[ss].attributes[map.getLayer(devPlanLayerID).objectIdField];
                        if (!mapPoint) {
                            map.centerAndZoom(highlightPoint, map._slider.maximum - 2);
                        }
                        HideRipple();
                        GlowRipple(highlightPoint);
                        newLeftOffice = 0;
                        CreateParkDetails(this, featureSet.features);
                        CreateParkDirections(this, featureSet.features);
                        if (mapPoint) {
                            ConfigureRoute(mapPoint);
                        }
                    }
                    tr.appendChild(td1);
                }
                dojo.byId('divActivityList').appendChild(table);
                CreateScrollbar(dojo.byId('divActivityListContainer'), dojo.byId('divActivityList'));
                dojo.byId('divActivityListContainerscrollbar_track').style.top = '20px';
                dojo.byId('divActivityListContainerscrollbar_track').style.right = '20px';
            }
            else {
                featureID = '';
                CreateScrollbar(dojo.byId('divActivityListContainer'), dojo.byId('divActivityList'));
            }
            if (parkCount == 0) {
                newLeftOffice = 0;
                featureID = featureSet.features[0].attributes[map.getLayer(devPlanLayerID).objectIdField];
                if (!mapPoint) {
                    map.centerAndZoom(featureSet.features[0].geometry, map._slider.maximum - 2);
                }
                HideRipple();
                GlowRipple(featureSet.features[0].geometry);
                CreateParkDetails(null, featureSet.features);
                CreateParkDirections(null, featureSet.features);
            }
            var node = dojo.byId('divLeftPanelBackground');
            if (dojo.coords(node).l != 0) {
                AnimateDetailsView();
            }
        });
    }
}

//Geocoding address
function GeoCodeAddress(evt) {
    var searchAddress; //variable for storing the address entered by user
    if (evt.id != 'directionSearch') {
        layer = true;
        var node = dojo.byId('divAddressContainer');
        var nodeBaseMap = dojo.byId('divBaseMapTitleContainer');

        if (nodeBaseMap.style.display != "none") {
            ShowHideBaseMapComponent();
        }

        if (node.style.display != "none") {
            WipeOutControl(node, 100);
        }

        if (searchAddress == dojo.byId("txtAddress").value && node.style.display != "none") {
            WipeOutControl(node, 500);
        }
        else if (searchAddress == dojo.byId("txtAddress").value && node.style.display == "none") {
            WipeInControl(node, 500);
        }
        var add = dojo.byId("txtAddress").value.split(",");
    }
    else {
        if (!dojo.byId("txtDAddress").disabled) {
            var add = dojo.byId("txtDAddress").value.split(",");
        }
        else {
            return;
        }
    }
    var address = [];
    var validAddressFlag = false;

    if (add.length == 1) {
        if (isValidZipCode(add[0].trim())) {
            validAddressFlag = true;
            address[locatorParams[0]] = '';
            address[locatorParams[1]] = '';
            address[locatorParams[2]] = '';
            address[locatorParams[3]] = add[0];
        }
    }
    else if (add.length == 2) {
        validAddressFlag = true;
        address[locatorParams[0]] = add[0];
        if (!isValidZipCode(add[1].trim())) {
            if (add[1].trim().length == 2) {
                address[locatorParams[1]] = '';
                address[locatorParams[2]] = add[1];
            }
            else {
                address[locatorParams[1]] = add[1];
                address[locatorParams[2]] = '';
            }
            address[locatorParams[3]] = '';
        }
        else {
            address[locatorParams[1]] = '';
            address[locatorParams[2]] = '';
            address[locatorParams[3]] = add[1];
        }
    }
    else if (add.length == 3) {
        validAddressFlag = true;
        address[locatorParams[0]] = add[0];
        address[locatorParams[1]] = add[1];
        if (!isValidZipCode(add[2].trim())) {
            address[locatorParams[2]] = add[2];
            address[locatorParams[3]] = '';
        }
        else {
            address[locatorParams[2]] = '';
            address[locatorParams[3]] = add[2];
        }
    }
    else if (add.length == 4) {
        validAddressFlag = true;
        address[locatorParams[0]] = add[0];
        address[locatorParams[1]] = add[1];
        address[locatorParams[2]] = add[2];
        address[locatorParams[3]] = add[3];
    }
    if (!validAddressFlag) {
        if (evt.id != 'directionSearch') {
            dojo.byId('txtAddress').value = '';
            dojo.byId('txtAddress').focus();
        }
        else {
            dojo.byId('txtDAddress').value = '';
            dojo.byId('txtDAddress').focus();
        }
        ShowDialog('Locator Error', messages.getElementsByTagName("adressFormat")[0].childNodes[0].nodeValue);
        return;
    }
    if (evt.id != 'directionSearch') {
        searchAddress = dojo.byId("txtAddress").value;
    }
    else {
        searchAddress = dojo.byId("txtDAddress").value;
    }
    ShowLoadingMessage('Loading...');
    var locator = new esri.tasks.Locator(locatorURL);
    locator.outSpatialReference = map.spatialReference;
    locator.addressToLocations(address, ["Loc_name"], function (candidates) {
        ShowLocatedAddress(candidates, evt);
    }, function (err) {
        HideLoadingMessage();
        ShowDialog('Error', err);
    });
}

//function to populate bing/esri addresses in table
function ShowLocatedAddress(candidates, evt) {
    RemoveChildren(dojo.byId('divAddressContainer'));
    if (candidates.length > 0) {
        if (evt.id == 'directionSearch') {
            candidate = candidates[0];
            if (mapPoint) {
                ClearGraphics();
                mapPoint = '';
            }
            if (!isNaN(candidate.location.x)) {
                mapPoint = new esri.geometry.Point(candidate.location.x, candidate.location.y, map.spatialReference);
            }
            else {
                HideLoadingMessage();
                ShowDialog('Error', 'Unable to find specified address.');
                return;
            }
            var symbol = new esri.symbol.PictureMarkerSymbol(locatorMarkupSymbolPath, 25, 25);
            var attr = { Address: dojo.byId('txtDAddress').value };
            var graphic = new esri.Graphic(mapPoint, symbol, attr, null);
            map.getLayer(tempGraphicsLayerId).add(graphic);
            ConfigureRoute(mapPoint);
        }
        else {

            if (candidates[0].score == 100) {
                defaultAddress = candidates[0].address;
                mapPoint = new esri.geometry.Point(candidates[0].location.x, candidates[0].location.y, map.spatialReference);
                LocateAddressOnMap(mapPoint);
            }
            else {
                var coords = dojo.coords('divAddress');
                var span = dojo.byId('divAddressContainer');
                dojo.style(span, {
                    left: coords.x + "px",
                    top: parseInt(coords.h) + parseInt(coords.y) + "px"
                });

                var table = document.createElement("table");
                var tBody = document.createElement("tbody");
                table.appendChild(tBody);
                table.cellSpacing = 0;
                table.cellPadding = 0;
                for (var i = 0; i < candidates.length; i++) {
                    var candidate = candidates[i];
                    var tr = document.createElement("tr");
                    tBody.appendChild(tr);
                    var td1 = document.createElement("td");
                    td1.innerHTML = candidate.address;
                    td1.className = 'tdAddressContainer';
                    td1.height = 20;
                    td1.setAttribute("x", candidate.location.x);
                    td1.setAttribute("y", candidate.location.y);
                    td1.onclick = function () {
                        dojo.byId('txtAddress').value = this.innerHTML;
                        defaultAddress = dojo.byId('txtAddress').value;
                        ShowLoadingMessage('Loading...');
                        mapPoint = new esri.geometry.Point(Number(this.getAttribute("x")), Number(this.getAttribute("y")), map.spatialReference);
                        LocateAddressOnMap(mapPoint);
                    }
                    tr.appendChild(td1);
                }
                dojo.byId('divAddressContainer').appendChild(table);
                AnimateAdvanceSearch();
                HideLoadingMessage();
            }
        }
    }
    else {
        HideLoadingMessage();
        if (!layer) {
            dojo.byId('tdParkDirections').innerHTML = '';
            dojo.byId('directionContainer').style.display = 'none';
            map.graphics.clear();
            map.getLayer(tempGraphicsLayerId).clear();
            mapPoint = '';
         }
        else {
            if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
                WipeOutControl(dojo.byId('divAddressContainer'), 100);
            }
            dojo.byId('txtAddress').focus();
        }
        ShowDialog('Locator Error', messages.getElementsByTagName("unableToLocate")[0].childNodes[0].nodeValue);
        return;
    }
}

//function to locate bing/esri address on map
function LocateAddressOnMap(mapPoint) {
    ClearGraphics();
    DoBuffer(bufferDistance, mapPoint);
    if (!map.getLayer(baseMapLayerCollection[0].Key).fullExtent.contains(mapPoint)) {
        ShowDialog('Error', 'Data not available for the specified address.');
        return;
    }
    var symbol = new esri.symbol.PictureMarkerSymbol(locatorMarkupSymbolPath, 25, 25);
    var attr = { Address: dojo.byId('txtAddress').value };
    var graphic = new esri.Graphic(mapPoint, symbol, attr, null);
    map.getLayer(tempGraphicsLayerId).add(graphic);
    if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
        WipeOutControl(dojo.byId('divAddressContainer'), 500);
    }
}

//function for drawing the buffer
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

//function for Displaying the buffer
function ShowBuffer(geometries) {
    ClearBuffer();
    var lineColor = new dojo.Color();
    lineColor.setColor(rendererColor);
    var fillColor = new dojo.Color();
    fillColor.setColor(rendererColor);
    fillColor.a = 0.45;
    var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
        lineColor, 2),
        fillColor);
    dojo.forEach(geometries, function (geometry) {
        AddGraphic(map.getLayer(tempBufferLayer), symbol, geometry);
    });
    map.setExtent(geometries[0].getExtent().expand(1.6));
    QueryLayer(geometries[0]);
}

//function for getting the features and their length with in the buffer region
function QueryLayer(geometry) {
    var qTask = 'qTask';
    qTask = new esri.tasks.QueryTask(devPlanLayerURL);
    var query = new esri.tasks.Query();
    query.geometry = geometry;
    query.where = "1=1";
    query.outFields = ["*"];
    query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
    query.returnGeometry = true;

    qTask.execute(query, function (featureset) {
        if (dojo.byId('spanParkActivityContainer')) {
            dojo.byId('spanParkActivityContainer').style.display = 'none';
        }
        dojo.byId('spanParkListContainer').innerHTML = 'Found ' + featureset.features.length + ' park(s) near the address';
        CreateDistance(featureset);
    });
}

//function for getting the distances between two points and placing them ascending order according to their distances in an array
function CreateDistance(featureset) {
    var distances = [];
    var featureDetails = [];
    for (var i = 0; i < featureset.features.length; i++) {
        var distParams = new esri.tasks.DistanceParameters();
        distParams.distanceUnit = esri.tasks.GeometryService.UNIT_STATUTE_MILE;
        distParams.geometry1 = mapPoint;
        distParams.geometry2 = featureset.features[i].geometry;
        distParams.geodesic = true;
        GetDistance(mapPoint, featureset.features[i].geometry);
        distances[featureset.features[i].attributes[infoWindowHeader[0].FieldName]] = [];
        distances[featureset.features[i].attributes[infoWindowHeader[0].FieldName]].push({ dist: dojo.number.format(distance) });
        if (i == (featureset.features.length - 1)) {
            for (var featureCount = 0; featureCount < featureset.features.length; featureCount++) {
                if (!(featureDetails[featureset.features[featureCount].attributes[infoWindowHeader[0].FieldName]])) {
                    featureDetails[featureset.features[featureCount].attributes[infoWindowHeader[0].FieldName]] = [];
                    featureDetails[featureset.features[featureCount].attributes[infoWindowHeader[0].FieldName]].push({ name: featureCount, attributes: featureset.features[featureCount].attributes, geometry: featureset.features[featureCount].geometry, dist: distances[featureset.features[featureCount].attributes[infoWindowHeader[0].FieldName]][0].dist });
                }
            }
            var order = 0;
            for (var feature in featureDetails) {
                features[order] = [];
                features[order] = ({ name: feature, attributes: featureDetails[feature][0].attributes, geometry: featureDetails[feature][0].geometry, dist: featureDetails[feature][0].dist });
                order++;
            }
            features.sort(function (a, b) {
                return a.dist - b.dist;
            });
            CreateParkList(features);
            newLeftOffice = 0;
            CreateParkDetails(null, features);
            CreateParkDirections(null, features);
            ConfigureRoute(mapPoint);
            map.getLayer(highlightPollLayerId).clear();
            featureID = features[0].attributes[map.getLayer(devPlanLayerID).objectIdField];
            HideRipple();
            GlowRipple(features[0].geometry);
        }
    }
    if (!(featureset.features.length)) {
        featureID = '';
        HideRipple();
        map.graphics.clear();
        RemoveChildren(dojo.byId('divParkList'));
        dojo.byId('divParkListContainer').style.display = 'block';
        dojo.byId('divParkListContainer').style.borderBottom = '';
        dojo.byId('divActivityListContainer').style.display = 'none';
        CreateScrollbar(dojo.byId('divParkListContainer'), dojo.byId('divParkList'));
        RemoveChildren(dojo.byId('divParkDetails'));
        RemoveChildren(dojo.byId('divParkDirections'));
        if (dojo.byId('divParkActivity')) {
            RemoveChildren(dojo.byId('divParkActivity'));
            dojo.byId('divParkActivity').style.borderBottom = '';
            CreateScrollbar(dojo.byId('divParkActivityContainer'), dojo.byId('divParkActivity'));
            dojo.byId('divParkActivityContainer').style.borderBottom = '';
        }
        HideLoadingMessage();
    }
    var node = dojo.byId('divLeftPanelBackground');
    if (dojo.coords(node).l != 0) {
        AnimateDetailsView();
    }
}

//function for displaying the parks list exists in the buffer region
function CreateParkList(features) {
    map.infoWindow.hide();
    dojo.byId('divParkListContainer').style.display = 'block';
    dojo.byId('divParkActivityContainer').style.display = 'none';
    dojo.byId('divActivityListContainer').style.display = 'none';
    dojo.byId('divParkListContainer').style.height = '180px';
    dojo.byId('divParkList').style.height = "155px";
    dojo.byId('divParkListContainer').style.borderBottom = '#F5F5DC 1px solid';
    dojo.byId('divParkListContainer').style.marginBottom = '8px';
    RemoveChildren(dojo.byId('divParkList'));
    var divContainer = dojo.byId('divParkList');
    var table;
    var tBody;
    if (!dojo.byId('tblAddressList')) {
        table = document.createElement('table');
        tBody = document.createElement('tbody');
        table.id = 'tblAddressList';
        table.style.width = "90%";
        tBody.id = 'tBodyAddressList';
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.appendChild(tBody);
    }
    else {
        table = dojo.byId('tblAddressList');
        tBody = dojo.byId('tBodyAddressList');
    }

    for (var i = 0; i < features.length; i++) {
        var tr = document.createElement('tr');
        tr.id = "trparkList" + i;
        tBody.appendChild(tr);
        var tdparkList = document.createElement('td');
        tdparkList.id = "tdparkList" + i;
        tdparkList.style.paddingLeft = '10px';
        if (i == 0) {
            tdparkList.style.backgroundColor = "#3C4824";
        }
        tdparkList.style.height = "20px";
        tdparkList.innerHTML = features[i].attributes[infoWindowHeader[0].FieldName] + '&nbsp(' + features[i].dist + ' miles)';
        tdparkList.setAttribute("count", i);
        tdparkList.onmouseover = function (evt) {
            this.style.cursor = 'pointer';
        };
        tdparkList.onmouseout = function (evt) {
            this.style.cursor = 'default';
        };
        tdparkList.onclick = function (evt) {
            map.graphics.clear();
            map.getLayer(highlightPollLayerId).clear();
            map.infoWindow.hide();
            var point = this.getAttribute('count');
            for (var l = 0; l < features.length; l++) {
                dojo.byId('tdparkList' + l).style.backgroundColor = "";
            }
            this.style.backgroundColor = "#3C4824";
            var highlightPoint = features[point].geometry;
            featureID = features[point].attributes[map.getLayer(devPlanLayerID).objectIdField];
            HideRipple();
            GlowRipple(highlightPoint);
            newLeftOffice = 0;
            CreateParkDetails(this, features);
            CreateParkDirections(this, features);
            ConfigureRoute(mapPoint);
        }
        tr.appendChild(tdparkList);
    }
    divContainer.appendChild(table);
    CreateScrollbar(dojo.byId('divParkListContainer'), dojo.byId('divParkList'));
}

//function for displaying the details of that particular park
function CreateParkDetails(point, features) {
    RemoveChildren(dojo.byId('divParkDetails'));
    var s;
    if (point) {
        s = point.getAttribute('count');
    }
    else {
        s = 0;
    }
    var attributes = features[s].attributes;
    var mainContainer = dojo.byId('divParkDetails');
    mainContainer.style.marginBottom = '8px';
    mainContainer.style.marginLeft = '10px';
    var bold = document.createElement('b');
    bold.className = 'cbottom';
    bold.style.width = "95%";
    var lines;
    for (var w = 1; w < 5; w++) {
        lines = document.createElement('b');
        lines.className = 'c' + w;
        bold.appendChild(lines);
    }
    mainContainer.appendChild(bold);
    var tableHeader;
    var tBodyHeader;
    if (!dojo.byId('tblAddressDetails')) {
        tableHeader = document.createElement('table');
        tBodyHeader = document.createElement('tbody');
        tableHeader.id = 'tblAddressDetails';
        tableHeader.style.width = "95%";
        tBodyHeader.id = 'tBodyAddressDetails';
        tableHeader.cellSpacing = 0;
        tableHeader.cellPadding = 0;
        tableHeader.appendChild(tBodyHeader);
    }
    else {
        tableHeader = dojo.byId('tblAddressDetails');
        tBodyHeader = dojo.byId('tBodyAddressDetails');
    }
    var trHeader = document.createElement('tr');
    trHeader.id = "trparkHeaderDetails";
    tBodyHeader.appendChild(trHeader);
    var tdHeader = document.createElement('td');
    tdHeader.id = "tdparkHeaderDetails";
    tdHeader.style.height = "30px";
    tdHeader.style.backgroundColor = "#3C4824";
    tdHeader.style.paddingLeft = '10px';
    trHeader.appendChild(tdHeader);
    var span = document.createElement('span');
    span.id = 'leftInfoWindowHeader';
    span.style.fontWeight = 'bolder';
    if (!features[s].feature) {
        span.innerHTML = features[s].attributes[infoWindowHeader[0].FieldName];
    }
    else {
        span.innerHTML = features[s].feature.attributes[infoWindowHeader[0].Alias];
    }
    tdHeader.appendChild(span);
    var devPlanLayer = map.getLayer(devPlanLayerID);

    var container = document.createElement('div');
    container.id = "scrollbar_container1";
    container.style.overflow = "hidden";
    container.style.position = "relative";
    container.style.backgroundColor = "#849966";
    container.style.width = "95%";
    container.style.height = 112 + "px";

    var divInfoWindow = document.createElement("div");
    divInfoWindow.id = "divInfoWindows";
    divInfoWindow.style.overflow = "hidden";
    divInfoWindow.style.height = 112 + "px";
    divInfoWindow.className = 'scrollbar_content';
    divInfoWindow.style.width = "95%"
    if (!(dojo.byId("tblAddressContent"))) {
        var table = document.createElement("table");
        table.style.width = "95%";
        table.style.marginLeft = "10px";
        var tBody = document.createElement("tbody");
        tBody.id = "tbodyAddressContent";
        table.appendChild(tBody);
        table.id = "tblAddressContent";
        table.cellSpacing = 0;
        table.cellPadding = 0;
    }
    else {
        table = dojo.byId("tblAddressContent");
        tBody = dojo.byId('tbodyAddressContent');
    }
    if (!features[s].feature) {
        for (var i in devPlanLayer.fields) {
            if (!attributes[devPlanLayer.fields[i].name]) {
                attributes[devPlanLayer.fields[i].name] = "-";
                continue;
            }
            if (devPlanLayer.fields[i].type == "esriFieldTypeDate") {
                if (attributes[devPlanLayer.fields[i].name]) {
                    var date = new js.date();
                    var utcMilliseconds = Number(attributes[devPlanLayer.fields[i].name]);
                    attributes[devPlanLayer.fields[i].name] = dojo.date.locale.format(date.utcTimestampFromMs(utcMilliseconds), { datePattern: formatDateAs, selector: "date" });
                }
            }
        }
    }
    for (var key = 0; key < infoPopupFieldsCollection.length; key++) {
        var tr = document.createElement("tr");
        tBody.appendChild(tr);
        var tdRow = document.createElement('td');
        tr.appendChild(tdRow);
        var tableRow = document.createElement('table');
        tableRow.cellPadding = 0;
        tableRow.cellSpacing = 0;
        tdRow.appendChild(tableRow);
        var tbodyRow = document.createElement('tbody');
        tableRow.appendChild(tbodyRow);
        var trRow = document.createElement('tr');
        tbodyRow.appendChild(trRow);
        var td1 = document.createElement("td");
        if (infoPopupFieldsCollection[key].DisplayText) {
            td1.innerHTML = infoPopupFieldsCollection[key].DisplayText + ':';
        }
        else {
            for (var i = 0; i < devPlanLayer.fields.length; i++) {
                if (!features[s].feature) {
                    var field = infoPopupFieldsCollection[key].FieldName;
                }
                else {
                    var field = infoPopupFieldsCollection[key].Alias;
                }
                if (devPlanLayer.fields[i].name == field) {
                    td1.innerHTML = devPlanLayer.fields[i].alias + ':';
                }
            }
        }
        td1.height = 20;
        var td2 = document.createElement("td");
        td2.height = 20;
        td2.style.paddingLeft = '5px';
        if (!features[s].feature) {
            if (features[s].attributes[infoPopupFieldsCollection[key].FieldName] != "-") {
                td2.innerHTML = features[s].attributes[infoPopupFieldsCollection[key].FieldName];
            }
            else {
                td2.innerHTML = displayValue;
            }
        }
        else {
            if ((features[s].feature.attributes[infoPopupFieldsCollection[key].Alias].toLowerCase() != 'null') && (features[s].feature.attributes[infoPopupFieldsCollection[key].Alias].toLowerCase() !='0')) {
                    td2.innerHTML = features[s].feature.attributes[infoPopupFieldsCollection[key].Alias];
            }
            else {
                td2.innerHTML = displayValue;
            }
        }
        trRow.appendChild(td1);
        trRow.appendChild(td2);
    }

    var trimg = document.createElement('tr');
    trimg.style.display = 'none';
    trimg.style.paddingTop = '3px';
    tBody.appendChild(trimg);
    var tdAct = document.createElement('td');
    trimg.appendChild(tdAct);
    var tableAct = document.createElement('table');
    tableAct.cellSpacing = 0;
    tableAct.cellPadding = 0;
    tableAct.style.width = "100%";
    tableAct.style.height = "100%";
    tdAct.appendChild(tableAct);
    var tbodyAct = document.createElement('tbody');
    tableAct.appendChild(tbodyAct);
    var trAct = document.createElement('tr');
    tbodyAct.appendChild(trAct);

    var tdLeft = document.createElement('td');
    tdLeft.id = 'tdLeftArrow';
    var divArr = document.createElement('div');
    divArr.id = 'divLeftArrow';
    divArr.style.width = '20px';
    divArr.innerHTML = "<img src='images/disabledArrowLeft.png' class='disabledText' id='idLeftArrow' style='height:20px;display:none'/>";
    divArr.onclick = function () {
        SlideLeft();
    }
    tdLeft.appendChild(divArr);
    trAct.appendChild(tdLeft);

    var tdAct = document.createElement('td');
    tdAct.style.width = "230px";
    tdAct.style.height = '27px';
    trAct.appendChild(tdAct);
    var divAct = document.createElement('div');
    divAct.id = 'divActData';
    divAct.style.position = 'relative';
    divAct.style.overflow = 'hidden';
    divAct.style.width = '100%';
    divAct.style.height = '100%';
    divAct.style.float = 'left';
    tdAct.appendChild(divAct);
    var divScroll = document.createElement('div');
    divScroll.id = 'divScroll';
    divScroll.style.float = 'left';
    divScroll.style.position = 'absolute';
    divAct.appendChild(divScroll);
    var divActContainer = document.createElement('div');
    divActContainer.id = 'divActContainer';
    divScroll.appendChild(divActContainer);
    var tableContainer = document.createElement('table');
    tableContainer.cellSpacing = 0;
    tableContainer.cellPadding = 0;
    divActContainer.appendChild(tableContainer);
    var tbodyContainer = document.createElement('tbody');
    tableContainer.appendChild(tbodyContainer);
    var trContainer = document.createElement('tr');
    tbodyContainer.appendChild(trContainer);
    for (var j = 0; j < infoActivity.length; j++) {
        if (!features[s].feature) {
            var activity = features[s].attributes[infoActivity[j].FieldName];
        }
        else {
            for (var l = 0; l < devPlanLayer.fields.length; l++) {
                var field = infoActivity[j].FieldName;
                if (devPlanLayer.fields[l].name == field) {
                    var alis = devPlanLayer.fields[l].alias;
                }
            }
            var activity = features[s].feature.attributes[alis];
        }
        if (activity == "Yes") {
            trimg.style.display = 'block';
            var tdimg = document.createElement('td');
            tdimg.style.width = '30px';
            tdimg.style.paddingLeft = '3px';
            if (!(infoActivity[j].Alias)) {
                for (var i = 0; i < devPlanLayer.fields.length; i++) {
                    if (devPlanLayer.fields[i].name == infoActivity[j].FieldName) {
                        var imgTitle = devPlanLayer.fields[i].alias;
                    }
                }
            }
            else {
                var imgTitle = infoActivity[j].Alias;
            }
            tdimg.innerHTML = "<img src='" + infoActivity[j].Image + "' title='" + imgTitle + "' style='height:25px'/>";
            trContainer.appendChild(tdimg);
        }
    }
    var tdRight = document.createElement('td');
    var divAr = document.createElement('div');
    divAr.id = 'divRightArrow';
    divAr.style.width = '20px';
    divAr.innerHTML = "<img src='images/disabledArrowRight.png'  class='disabledText' id='idRightArrow' style='height:20px;display:none'/>";
    divAr.onclick = function () {
        SlideRight();
    }
    tdRight.appendChild(divAr);
    trAct.appendChild(tdRight);
    var round = document.createElement('div');
    round.id = 'bottomRound';
    round.style.width = "95%";
    round.className = 'dbottom';
    var bottomline;
    for (var w = 4; w > 0; w--) {
        bottomline = document.createElement('b');
        bottomline.className = 'c' + w;
        bottomline.style.backgroundColor = "#849966";
        round.appendChild(bottomline);
    }
    divInfoWindow.appendChild(table);
    container.appendChild(divInfoWindow);
    mainContainer.appendChild(tableHeader);
    mainContainer.appendChild(container);
    mainContainer.appendChild(round);
    CreateScrollbar(dojo.byId('scrollbar_container1'), dojo.byId('divInfoWindows'));
    dojo.byId('scrollbar_container1scrollbar_track').style.right = '5px';
}

//function for Displaying directions to that particular park
function CreateParkDirections(point, features) {
    setTimeout(function () {
        if (dojo.byId('divActData').offsetWidth < dojo.byId('divScroll').offsetWidth) {
            dojo.byId('idRightArrow').src = 'images/arrRight.png';
            dojo.byId('idRightArrow').style.cursor = 'pointer';
            dojo.byId('idLeftArrow').style.display = 'block';
            dojo.byId('idLeftArrow').style.cursor = 'default';
            dojo.byId('idRightArrow').style.display = 'block';
        }
        else {
            dojo.byId('idRightArrow').src = 'images/disabledArrowRight.png';
            dojo.byId('idRightArrow').style.cursor = 'default';
            dojo.byId('tdLeftArrow').style.display = 'none';
            dojo.byId('divLeftArrow').style.display = 'none';
            dojo.byId('divRightArrow').style.display = 'none';
        }
    }, 80);
    if (dijit.byId('btnCurrentLocation')) {
        dijit.byId('btnCurrentLocation').destroy();
    }
    if (dijit.byId('txtDAddress')) {
        dijit.byId('txtDAddress').destroy();
    }
    RemoveChildren(dojo.byId('divParkDirections'));
    var s;
    if (point) {
        s = point.getAttribute('count');
    }
    else {
        s = 0;
    }
    if (!features[s].feature) {
        pollPoint = features[s].geometry;
    }
    else {
        pollPoint = features[s].feature.geometry;
    }
    var mainContainer = dojo.byId('divParkDirections');
    mainContainer.style.marginLeft = '10px';
    var bold = document.createElement('b');
    bold.className = 'cbottom';
    bold.style.width = "95%";
    var lines;
    for (var w = 1; w < 5; w++) {
        lines = document.createElement('b');
        lines.className = 'c' + w;
        bold.appendChild(lines);
    }
    mainContainer.appendChild(bold);
    var tableHeader;
    var tBodyHeader;
    if (!dojo.byId('tblAddressDirections')) {
        tableHeader = document.createElement('table');
        tBodyHeader = document.createElement('tbody');
        tableHeader.id = 'tblAddressDirections';
        tableHeader.style.width = "95%";
        tBodyHeader.id = 'tBodyAddressDirections';
        tableHeader.cellSpacing = 0;
        tableHeader.cellPadding = 0;
        tableHeader.appendChild(tBodyHeader);
    }
    else {
        tableHeader = dojo.byId('tblAddressDirections');
        tBodyHeader = dojo.byId('tBodyAddressDirections');
    }
    var trHeader = document.createElement('tr');
    trHeader.id = "trparkHeaderDirections";
    tBodyHeader.appendChild(trHeader);
    var tdHeader = document.createElement('td');
    tdHeader.id = "tdparkHeaderDirections";
    tdHeader.style.height = "30px";
    tdHeader.style.backgroundColor = "#3C4824";
    tdHeader.style.paddingLeft = '10px';
    trHeader.appendChild(tdHeader);
    var span = document.createElement('span');
    span.style.fontWeight = 'bolder';
    span.id = 'directionHeader';
    if (!features[s].feature) {
        span.innerHTML = 'Directions to ' + features[s].attributes[infoWindowHeader[0].FieldName];
    }
    else {
        span.innerHTML = 'Directions to ' + features[s].feature.attributes[infoWindowHeader[0].Alias];
    }
    tdHeader.appendChild(span);
    var container = document.createElement('div');
    container.id = "scrollbar_container2";
    container.style.height = 170 + 'px';
    container.style.width = "95%";
    container.style.backgroundColor = "#849966";
    if (!(dojo.byId("tblAddressContentDirections"))) {
        var table = document.createElement("table");
        table.style.width = "95%";
        var tBody = document.createElement("tbody");
        tBody.id = "tbodyAddressContentDirections";
        table.appendChild(tBody);
        table.id = "tblAddressContentDirections";
        table.style.marginLeft = '10px';
        table.cellSpacing = 0;
        table.cellPadding = 0;
    }
    else {
        table = dojo.byId("tblAddressContentDirections");
        tBody = dojo.byId('tbodyAddressContentDirections');
    }
    if (!layer) {
        var trActivity = document.createElement('tr');
        trActivity.id = 'trActivityId';
        tBody.appendChild(trActivity);
        var tdActivity = document.createElement('td');
        tdActivity.id = 'tdActivityId';

        var divActivity = document.createElement('div');
        divActivity.id = 'activity';
        tdActivity.appendChild(divActivity);

        var spanTable = document.createElement('table');
        spanTable.cellSpacing = 0;
        spanTable.cellPadding = 0;
        spanTable.style.fontSize = 10.5 +'px';
        divActivity.appendChild(spanTable);
        var spanTbody = document.createElement('tbody');
        spanTable.appendChild(spanTbody);
        var spanTr = document.createElement('tr');
        spanTbody.appendChild(spanTr);

        var spanAct = document.createElement('td');
        spanAct.style.float = 'left';
        if (!Modernizr.geolocation) {
            spanAct.innerHTML = 'Use address to get directions';
        } else {
            spanAct.innerHTML = 'Use current location or address to get directions';
        }
        spanTr.appendChild(spanAct);
        var tableAct = document.createElement('table');
        tableAct.cellSpacing = 0;
        tableAct.cellPadding = 0;
        divActivity.appendChild(tableAct);
        var tbodyAct = document.createElement('tbody');
        tableAct.appendChild(tbodyAct);
        var trAct = document.createElement('tr');
        tbodyAct.appendChild(trAct);
        var tdFrom = document.createElement('td');
        trAct.appendChild(tdFrom);
        var spanFrom = document.createElement('span');
        spanFrom.innerHTML = 'From';
        tdFrom.appendChild(spanFrom);
        var tdLoc = document.createElement('td');
        tdLoc.id = 'tdLocation';
        if (!Modernizr.geolocation) {
            tdLoc.style.display = "none";
        }
        trAct.appendChild(tdLoc);
        var btnLocation = document.createElement('button');
        btnLocation.id = 'btnCurrentLocation';
        tdLoc.appendChild(btnLocation);
        var dojoButton = new dijit.form.ToggleButton({
            label: "<img src='images/imgGeolocation.png' style='height:20px;width:20px;cursor:pointer'/>",
            title:'My Location',
            onClick: function () {
                ShowCurrentLocation(this);
            }
        }, btnLocation);
        var tdOr = document.createElement('td');
        tdOr.id = "tdOr";
        if (!Modernizr.geolocation) {
            tdOr.style.display = "none";
        }
        trAct.appendChild(tdOr);
        var spanOr = document.createElement('span');
        spanOr.innerHTML = '<b>OR</b>';
        tdOr.appendChild(spanOr);
        var tdAddress = document.createElement('td');
        tdAddress.style.paddingLeft = '5px';
        trAct.appendChild(tdAddress);
        var text = document.createElement('input');
        text.type = 'text';
        text.id = 'txtDAddress';
        if (!Modernizr.geolocation) {
            text.style.width = '200px';
        }
        else {
            text.style.width = '150px';
        }
        if (mapPoint) {
                text.value = map.getLayer(tempGraphicsLayerId).graphics[0].attributes.Address;
        }
        else {
            text.value = defaultAddress;
        }
        text.setAttribute("placeholder", "Address,zip");
        text.style.backgroundColor = "#3C4824";
        text.style.color = "#F5F5DC";
        text.title = "Enter an address to locate";
        tdAddress.appendChild(text);

        var tdimgLoc = document.createElement('td');
        trAct.appendChild(tdimgLoc);
        var imgLoc = document.createElement('img');
        imgLoc.src = 'images/imgSearch.png';
        imgLoc.id = 'directionSearch';
        imgLoc.onclick = function () {
            GeoCodeAddress(this);
        };
        imgLoc.style.width = '20px';
        imgLoc.style.height = '20px';
        imgLoc.style.cursor = 'pointer';
        imgLoc.title = 'Search';
        tdimgLoc.appendChild(imgLoc);

        tdActivity.style.borderBottom = "white 1px dotted";
        trActivity.appendChild(tdActivity);
    }
    var tr = document.createElement("tr");
    tBody.appendChild(tr);
    var td = document.createElement("td");
    td.id = 'tdParkDirections';
    td.height = 20;
    td.style.padding = '3px';
    td.style.paddingLeft = '0px';
    if (layer) {
        td.style.borderBottom = "white 1px dotted";
    }
    tr.appendChild(td);
    var tr1 = document.createElement("tr");
    tBody.appendChild(tr1);
    var td1 = document.createElement('td');
    td1.style.verticalAlign = 'top';
    tr1.appendChild(td1);
    var divContainer = document.createElement('div');
    divContainer.id = 'directionContainer';
    if (layer) {
        divContainer.style.height = 130 + "px";
    }
    else {
        divContainer.style.height = 90 + "px";
    }
    divContainer.style.position = "relative";
    td1.appendChild(divContainer);
    var div = document.createElement('div');
    div.id = 'direction';
    if (layer) {
        div.style.height = 130 + "px";
    }
    else {
        div.style.height = 90 + "px";
    }
    div.style.width = "95%";
    div.style.overflow = 'hidden';
    divContainer.appendChild(div);
    var round = document.createElement('div');
    round.id = 'bottomRoundDirections';
    round.className = 'dbottom';
    round.style.width = '95%';
    var bottomline;
    for (var w = 4; w > 0; w--) {
        bottomline = document.createElement('b');
        bottomline.className = 'c' + w;
        bottomline.style.backgroundColor = "#849966";
        round.appendChild(bottomline);
    }
    container.appendChild(table);
    mainContainer.appendChild(tableHeader);
    mainContainer.appendChild(container);
    mainContainer.appendChild(round);
}


