/*
 | Version 10.2
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
//Configure the route between two points
function ConfigureRoute(mapPoint, park) {
    if (!getDirections) {
        if (!isMobileDevice) {
            if (isTablet && !getDirectionsMobile) {
                dojo.byId("divDirections").style.display = "none";
            }
        } else {
            dojo.byId("imgDirections").style.display = "none";
        }
    } else {
        if (!isMobileDevice) {
            if (isTablet && getDirectionsMobile) {
                dojo.byId("divDirections").style.display = "block";
            }
        } else {
            if (getDirectionsMobile) {
                dojo.byId("imgDirections").style.display = "block";
            }
        }
        ShowProgressIndicator();
        map.getLayer(routeLayerId).clear();
        routeParams.stops.features = [];
        routeParams.stops.features[0] = new esri.Graphic(mapPoint, null);
        routeParams.stops.features[1] = new esri.Graphic(park, null);
        //If both the "to" and the "from" addresses are set, solve the route
        if (routeParams.stops.features.length === 2) {
            if (getDirections) {
                routeTask.solve(routeParams);
            }
            else {
                HideProgressIndicator();
                dojo.byId("imgDirections").style.display = "block";
            }
        }
    }
}

var drivingDirections = [];

//Display the route between two points
function ShowRoute(solveResult) {
    drivingDirections = [];
    RemoveChildren(dojo.byId("divDirection"));
    if (!searchAddressViaPod) {
        dojo.byId("divDirectionContent").style.display = "block";
    } else {
        HideProgressIndicator();
    }
    if (isMobileDevice) {
        dojo.byId("tdPrint").style.display = "none";
        dojo.byId("divNewInfoDirectionsScroll").style.display = "none";
        dojo.byId("divInfoDirectionsScroll").style.display = "block";
        dojo.byId("divInfoDirectionsScroll").appendChild(dojo.byId("divAddressContentDirections"));
    }
    var directions = solveResult.routeResults[0].directions;
    dojo.byId("tdPrint").style.display = "block";

    //Add route to the map
    map.getLayer(routeLayerId).add(new esri.Graphic(directions.mergedGeometry, routeSymbol, null, null));
    map.getLayer(routeLayerId).show();

    if (!map.getLayer(tempBufferLayer).graphics.length > 0) {
        map.setExtent(directions.mergedGeometry.getExtent().expand(3));
    }
    directionsHeaderArray = [];
    //Display the total time and distance of the route
    dojo.byId("tdTotalDistance").innerHTML = "Total distance: " + FormatDistance(directions.totalLength, "mile(s)");
    directionsHeaderArray.push(dojo.byId("tdTotalDistance").innerHTML);
    dojo.byId("tdTotalTime").innerHTML = "Duration: " + FormatTime(directions.totalTime);
    directionsHeaderArray.push(dojo.byId("tdTotalTime").innerHTML);
    dojo.byId("divDirectionContainer").style.display = "block";
    var tableDir;
    var tBodyDir;
    if (!dojo.byId("tblDir")) {
        tableDir = document.createElement("table");
        tBodyDir = document.createElement("tbody");
        tableDir.id = "tblDir";
        tableDir.style.width = "95%";
        tBodyDir.id = "tBodyDir";
        tableDir.appendChild(tBodyDir);
    } else {
        tableDir = dojo.byId("tblDir");
        tBodyDir = dojo.byId("tBodyDir");
    }

    dojo.forEach(solveResult.routeResults[0].directions.features, function (feature, i) {
        dojo.byId("divDirectionSearchContent").style.display = "none";
        dojo.byId("divDirectionContent").style.display = "block";
        var miles = FormatDistance(feature.attributes.length, "miles");
        var trDir = document.createElement("tr");
        tBodyDir.appendChild(trDir);
        var tdDirNum = document.createElement("td");
        tdDirNum.vAlign = "top";
        tdDirNum.innerHTML = (Number(i) + 1) + ". ";
        trDir.appendChild(tdDirNum);
        var tdDirVal = document.createElement("td");
        if (i === 0) {
            tdDirVal.innerHTML = feature.attributes.text.replace('Location 1', map.getLayer(tempGraphicsLayerId).graphics[0].attributes.Address);
            drivingDirections.push({
                "text": tdDirVal.innerHTML
            });
        } else if (i === (solveResult.routeResults[0].directions.features.length - 1)) {
            if (isMobileDevice) {
                tdDirVal.innerHTML = feature.attributes.text.replace("Location 2", dojo.byId("tdPName").getAttribute("parkName"));
            } else {
                tdDirVal.innerHTML = feature.attributes.text.replace("Location 2", dojo.byId("spanDirectionHeader").getAttribute("parkName"));
            }
            drivingDirections.push({
                "text": tdDirVal.innerHTML
            });
        } else {
            if (miles) {
                var distance = FormatDistance(feature.attributes.length, "miles");
                tdDirVal.innerHTML = feature.attributes.text + " (" + distance + ")";
                drivingDirections.push({
                    "text": feature.attributes.text,
                    "distance": distance
                });
            } else {
                tdDirVal.innerHTML = feature.attributes.text;
                drivingDirections.push({
                    "text": tdDirVal.innerHTML
                });
            }
        }
        trDir.appendChild(tdDirVal);
    });
    dojo.byId("divDirection").appendChild(tableDir);

    setTimeout(function () {
        CreateScrollbar(dojo.byId("divDirectionContainer"), dojo.byId("divDirection"));
    }, 500);
}

//Display errors caught attempting to solve the route
function ErrorHandler(err) {
    mapPoint = "";
    NewAddressSearch();
    HideProgressIndicator();
    alert(messages.getElementsByTagName("routeCouldNotBeCalculated")[0].childNodes[0].nodeValue);
}

//Format time
function FormatTime(time) {
    var hr = Math.floor(time / 60); //Important to use math.floor with hours
    var min = Math.round(time % 60);
    if (hr < 1 && min < 1) {
        return "less than a minute";
    } else if (hr < 1) {
        return min + " minute(s)";
    }
    return hr + " hour(s) " + min + " minute(s)";
}

//Round distance to nearest hundredth of a unit
function FormatDistance(dist, units) {
    var d = Math.round(dist * 100) / 100;
    if (d === 0) {
        return "";
    }
    return d + " " + units;
}