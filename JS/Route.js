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
//function for configuring the route betwwen two points
function ConfigureRoute(mapPoint) {
    ShowLoadingMessage("Loading...");
    ShowDojoLoading(dojo.byId('scrollbar_container2'));
    routeParams.stops.features = [];
    routeParams.stops.features[0] = new esri.Graphic(mapPoint, null);
    routeParams.stops.features[1] = new esri.Graphic(pollPoint, null);
    //If both the "to" and the "from" addresses are set, solve the route
    if (routeParams.stops.features.length === 2) {
        routeTask.solve(routeParams);
    }
}

//function for displaying the route between two points
function ShowRoute(solveResult) {
    map.graphics.clear(routeSymbol);
    var directions = solveResult.routeResults[0].directions;
    //Add route to the map
    map.graphics.add(new esri.Graphic(directions.mergedGeometry, routeSymbol));
    if (!layer) {
        map.setExtent(directions.mergedGeometry.getExtent().expand(2));
    }
    //Display the total time and distance of the route
    dojo.byId("tdParkDirections").innerHTML = "Total distance: " + FormatDistance(directions.totalLength, "mile(s)") + "<br />Total time: " + FormatTime(directions.totalTime);
    if (!layer) {
        dojo.byId('directionContainer').style.display = 'block';
    }
    var tableDir;
    var tBodyDir;
    if (!dojo.byId('tblDir')) {
        tableDir = document.createElement('table');
        tBodyDir = document.createElement('tbody');
        tableDir.id = 'tblDir';
        tableDir.style.width = "95%";
        tBodyDir.id = 'tBodyDir';
        tableDir.cellSpacing = 0;
        tableDir.cellPadding = 0;
        tableDir.appendChild(tBodyDir);
    }
    else {
        tableDir = dojo.byId('tblDir');
        tBodyDir = dojo.byId('tBodyDir');
    }

    dojo.forEach(solveResult.routeResults[0].directions.features, function (feature, i) {
        var miles = FormatDistance(feature.attributes.length, "miles");
        var trDir = document.createElement('tr');
        trDir.style.verticalAlign = 'top';
        tBodyDir.appendChild(trDir);
        var tdDirNum = document.createElement('td');
        tdDirNum.innerHTML = (i + 1) + ". &nbsp";
        trDir.appendChild(tdDirNum);
        var tdDirVal = document.createElement('td');
        tdDirVal.style.paddingBottom = '5px';
        if (i == 0) {
            tdDirVal.innerHTML = feature.attributes.text.replace('Location 1', map.getLayer(tempGraphicsLayerId).graphics[0].attributes.Address);
        }
        else if (i == (solveResult.routeResults[0].directions.features.length - 1)) {
            tdDirVal.innerHTML = feature.attributes.text.replace('Location 2', dojo.byId('leftInfoWindowHeader').innerHTML);
        }
        else {
            if (miles) {
                tdDirVal.innerHTML = feature.attributes.text + " (" + FormatDistance(feature.attributes.length, "miles") + ")";
            }
            else {
                tdDirVal.innerHTML = feature.attributes.text;
            }
        }
        trDir.appendChild(tdDirVal);
    });
    dojo.byId("direction").appendChild(tableDir);
    CreateScrollbar(dojo.byId('directionContainer'), dojo.byId('direction'));
    HideDojoLoading();
    HideLoadingMessage();
}

//Display any errors that were caught when attempting to solve the rotue
function ErrorHandler(err) {
    dojo.byId('divLoadMessage').innerHTML = err.message + "\n" + err.details.join("\n");
    dijit.byId('dialogLoadMessage').titleNode.innerHTML = 'Error';
    dijit.byId('dialogLoadMessage').show();
    HideDojoLoading();
    HideLoadingMessage();
    if (!layer) {
        dojo.byId('tdParkDirections').innerHTML = '';
        dojo.byId('directionContainer').style.display = 'none';
        map.graphics.clear();
        map.getLayer(tempGraphicsLayerId).clear();
        mapPoint = '';
    }
    if (dijit.byId('btnCurrentLocation')) {
        if (dijit.byId('btnCurrentLocation').checked) {
            dijit.byId('btnCurrentLocation').setAttribute('checked', false);
            dojo.byId('txtDAddress').disabled = false;
            dojo.byId('txtDAddress').title = 'Enter an address to locate';
            dojo.byId('directionSearch').style.cursor = 'pointer';
            dojo.byId('directionSearch').title = "Search";
        }
    }
}

//Format the time as hours and minutes
function FormatTime(time) {
    var hr = Math.floor(time / 60), //Important to use math.floor with hours
            min = Math.round(time % 60);

    if (hr < 1 && min < 1) {
        return "";
    }
    else if (hr < 1) {
        return min + " minute(s)";
    }

    return hr + " hour(s) " + min + " minute(s)";
}

//Round the distance to the nearest hundredth of a unit
function FormatDistance(dist, units) {
    var d = Math.round(dist * 100) / 100;
    if (d === 0) {
        return "";
    }

    return d + " " + units;
}