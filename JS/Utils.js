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
var hCal; //variable for storing the scrolling height value
var newLeftOffice = 0; //variable for storing the starting value for horizontal scroll
var newInfoLeftOffice = 0; //variable for storing the starting value for horizontal scroll at infowindow

//Function to switch to facebook,twitter,email
function ToggleApplication() {
    if (dojo.byId('divAddressContainer').children.length != 0) {
        if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
            WipeOutControl(dojo.byId('divAddressContainer'), 500);
        }
        setTimeout(function () { RemoveChildren(dojo.byId('divAddressContainer')); }, 500);
    }
    else {
        dojo.byId('divAddressContainer').style.display = 'none';
    }
    var bmapNode = dojo.byId('divBaseMapTitleContainer');
    if (dojo.coords(bmapNode).h > 0) {
        WipeOutControl(bmapNode, 500);
        dijit.byId('imgBaseMap').attr("checked", false);
    }

    var node = dojo.byId('divAppContainer');

    if (node.style.display == 'none') {
        WipeInControl(node, 500);
    }
    else {
        WipeOutControl(node, 500);
    }
}
//Dojo function to animate address container
function WipeInControl(node, duration) {
    dojo.fx.wipeIn({
        node: node,
        duration: duration
    }).play();
}

//Dojo function to animate address container
function WipeOutControl(node, duration) {
    dojo.fx.wipeOut({
        node: node,
        duration: duration
    }).play();
}

//Function triggered for animating address container
function AnimateAdvanceSearch() {
    var node = dojo.byId('divAddressContainer');
    if (node.style.display == "none") {
        WipeInControl(node, 0, 500);
    }
}

//Function for refreshing address container div
function RemoveChildren(parentNode) {
    while (parentNode.hasChildNodes()) {
        parentNode.removeChild(parentNode.lastChild);
    }
}

//Function for Clearing graphics on map
function ClearGraphics() {
    if (map.getLayer(tempGraphicsLayerId)) {
        map.getLayer(tempGraphicsLayerId).clear();
    }
}

//Function to open login page for facebook,tweet,email
function ShareLink(site) {
    mapExtent = getMapExtent();
    var url = esri.urlToObject(window.location.toString());
    if (featureID) {
        var urlStr = encodeURI(url.path) + "?featureID=" + pollPoint.x + "," + pollPoint.y + "," + featureID;
    }
    else {
        var urlStr = encodeURI(url.path) + "?extent=" + mapExtent;
    }
    url = dojo.string.substitute(tinyURLServiceURL.TinyURLServiceURL, [urlStr]);

    dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
        load: function (data) {
            var tinyUrl = data;
            var attr = tinyURLServiceURL.TinyURLResponseAttribute.split(".");
            for (var x = 0; x < attr.length; x++) {
                tinyUrl = tinyUrl[attr[x]];
            }

            switch (site) {
                case "facebook":
                    window.open(dojo.string.substitute(tinyURLServiceURL.FacebookShareURL, [tinyUrl]));
                    break;
                case "twitter":
                    window.open(dojo.string.substitute(tinyURLServiceURL.TwitterShareURL, [tinyUrl]));
                    break;
                case "mail":
                    parent.location = dojo.string.substitute(tinyURLServiceURL.ShareByMailLink, [tinyUrl]);
                    break;
            }
        },
        error: function (error) {
            ShowDialog('Error', messages.getElementsByTagName("tinyURLEngine")[0].childNodes[0].nodeValue);
        }
    });
}

//function for querying the features while sharing
function ExecuteQueryTask() {
    ShowLoadingMessage("Loading Feature(s)...");
    var query = new esri.tasks.Query;
    query.outSpatialReference = map.spatialReference;
    query.where = map.getLayer(devPlanLayerID).objectIdField + "=" + featureID;
    query.outFields = ["*"];
    query.returnGeometry = true;
    queryTask.execute(query, function (fset) {
        if (fset.features.length > 0) {
            ShowInfoWindow(fset.features[0], fset.features[0].geometry);
            var layer = map.getLayer(highlightPollLayerId);
            HideRipple();
            GlowRipple(fset.features[0].geometry);
            dojo.byId("txtAddress").value = fset.features[0].attributes[infoWindowHeader[0].FieldName];
            map.centerAndZoom(fset.features[0].geometry, map._slider.maximum - 2);
            layer.add(fset.features[0]);
        }
        HideLoadingMessage();
    }, function (err) {
        ShowDialog("Error", err.Message);
    });
}

//Function to get map Extent
function getMapExtent() {
    var extents = map.extent.xmin.toString() + ",";
    extents += map.extent.ymin.toString() + ",";
    extents += map.extent.xmax.toString() + ",";
    extents += map.extent.ymax.toString();
    return (extents);
}

//Function for displaying Standby text
function ShowLoadingMessage(loadingMessage) {
    dojo.byId('divLoadingIndicator').style.display = 'block';
    dojo.byId('loadingMessage').innerHTML = loadingMessage;
}

//Function for hiding Standby text
function HideLoadingMessage() {
    dojo.byId('divLoadingIndicator').style.display = 'none';
}

//Function for showing Alert messages
function ShowDialog(title, message) {
    dojo.byId('divMessage').innerHTML = message;
    var dialog = dijit.byId('dialogAlertMessage');
    dialog.titleNode.innerHTML = title;
    dialog.show();
    dojo.byId('divOKButton').focus();
}

//Function for hiding Alert messages
function CloseDialog() {
    dijit.byId('dialogAlertMessage').hide();
    if (dijit.byId('imgGeolocation')) {
        if (dijit.byId('imgGeolocation').checked) {
            dijit.byId('imgGeolocation').setAttribute('checked', false);
            dojo.byId('rbAddress').disabled = false;
            dojo.byId('rbParkActivity').disabled = false;
            dojo.byId('txtAddress').disabled = false;
            dojo.byId('spanAddress').style.cursor = 'pointer';
            dojo.byId('spanParkActivity').style.cursor = 'pointer';
            dojo.byId('imgLocateAddress').style.cursor = 'pointer';
            dojo.byId('imgLocateAddress').title = 'Search';
            if (dojo.byId('rbAddress').checked) {
                dojo.byId('spanAddress').className = 'text';
                dojo.byId('txtAddress').title = 'Enter an address to locate';
            }
            else {
                dojo.byId('spanParkActivity').className = 'disabledText';
                dojo.byId('txtAddress').title = 'Enter a park or activity name to locate';
            }
            return;
        }
    }
    if (dijit.byId('btnCurrentLocation')) {
        if (dijit.byId('btnCurrentLocation').checked) {
            dijit.byId('btnCurrentLocation').setAttribute('checked', false);
            dojo.byId('txtDAddress').disabled = false;
            dojo.byId('txtDAddress').title = 'Enter an address to locate';
            dojo.byId('directionSearch').style.cursor = 'pointer';
            dojo.byId('directionSearch').title = 'Search';
        }
    }
}

//function to slide left paenl
function AnimateDetailsView() {
    var node = dojo.byId('divLeftPanelBackground');
    if (dojo.coords(node).l == 0) {
        var divBackground = dojo.fx.slideTo({ node: node, duration: 1000, properties: { left: { end: -320, unit: "px"}} });
        var divContent = dojo.fx.slideTo({ node: dojo.byId('divSearchDetailsPanel'), duration: 1000, properties: { left: { end: -320, unit: "px"}} });
        var imageToggle = dojo.fx.slideTo({ node: dojo.byId('divToggleDetail'), duration: 1000, properties: { left: { end: 0, unit: "px"}} });
        var mapSlider = dojo.fx.slideTo({ node: dojo.byId('map_zoom_slider'), duration: 1000, properties: { left: { end: 15, unit: "px"}} });
        var combinedAnimation = dojo.fx.combine([divBackground, divContent, imageToggle, mapSlider]);
        dojo.connect(combinedAnimation, "onEnd", function () {
            dojo.byId('divToggleDetail').className = "divToggleDetailCollapse";
        });
        combinedAnimation.play();
    }
    else {
        var divBackground = dojo.fx.slideTo({ node: node, duration: 1000, properties: { left: { end: 0, unit: "px"}} });
        var divContent = dojo.fx.slideTo({ node: dojo.byId('divSearchDetailsPanel'), duration: 1000, properties: { left: { end: 0, unit: "px"}} });
        var imageToggle = dojo.fx.slideTo({ node: dojo.byId('divToggleDetail'), duration: 1000, properties: { left: { end: 320, unit: "px"}} });
        var mapSlider = dojo.fx.slideTo({ node: dojo.byId('map_zoom_slider'), duration: 1000, properties: { left: { end: 335, unit: "px"}} });
        var combinedAnimation = dojo.fx.combine([divBackground, divContent, imageToggle, mapSlider]);
        dojo.connect(combinedAnimation, "onEnd", function () {
            dojo.byId('divToggleDetail').className = "divToggleDetailExpand";
        });
        combinedAnimation.play();
    }
}

//function to trim string
String.prototype.trim = function () { return this.replace(/^\s+|\s+$/g, ''); }

//Function to append ... for a string
String.prototype.trimString = function (len) {
    return (this.length > len) ? this.substring(0, len) + "..." : this;
}

//function to create custom scroll bar
function CreateScrollbar(container, content) {
    var yMax;
    var pxLeft, pxTop, xCoord, yCoord;
    var scrollbar_track;
    var isHandleClicked = false;
    this.container = container;
    this.content = content;

    if (dojo.byId(container.id + 'scrollbar_track')) {
        RemoveChildren(dojo.byId(container.id + 'scrollbar_track'));
        container.removeChild(dojo.byId(container.id + 'scrollbar_track'));
    }
    if (!dojo.byId(container.id + 'scrollbar_track')) {
        scrollbar_track = document.createElement('div');
        scrollbar_track.id = container.id + "scrollbar_track";
        scrollbar_track.className = "scrollbar_track";
    }
    else {
        scrollbar_track = dojo.byId(container.id + 'scrollbar_track');
    }
    if (container.id == 'divParkListContainer') {
        scrollbar_track.style.top = '20px';
        scrollbar_track.style.right = '20px';
    }

    var containerHeight = dojo.coords(container);
    scrollbar_track.style.height = containerHeight.h + "px";

    var scrollbar_handle = document.createElement('div');
    scrollbar_handle.className = 'scrollbar_handle';
    scrollbar_handle.id = container.id + "scrollbar_handle";

    scrollbar_track.appendChild(scrollbar_handle);
    container.appendChild(scrollbar_track);

    if (content.scrollHeight <= content.offsetHeight) {
        scrollbar_handle.style.display = 'none';
        return;
    }
    else {
        scrollbar_handle.style.display = 'block';
        scrollbar_handle.style.height = Math.max(this.content.offsetHeight * (this.content.offsetHeight / this.content.scrollHeight), 25) + 'px';
        hCal = this.content.offsetHeight * (this.content.offsetHeight / this.content.scrollHeight);
        if (hCal > 25) {
            hCal = 10;
        }
        else if (hCal > 20) {
            hCal = 7;
        }
        else if (hCal > 15) {
            hCal = 4;
        }
        else if (hCal > 10) {
            hCal = 2;
        }
        else {
            hCal = 1;
        }
        yMax = this.content.offsetHeight - scrollbar_handle.offsetHeight;

        if (window.addEventListener) {
            content.addEventListener('DOMMouseScroll', ScrollDiv, false);
        }

        content.onmousewheel = function (evt) {
            console.log(content.id);
            ScrollDiv(evt);
        }
    }

    function ScrollDiv(evt) {
        var evt = window.event || evt //equalize event object
        var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta //delta returns +120 when wheel is scrolled up, -120 when scrolled down
        pxTop = scrollbar_handle.offsetTop;
        if (delta <= -120) {
            var y = pxTop + hCal;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
        else {
            var y = pxTop - hCal;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
    }

    //Attaching events to scrollbar components
    scrollbar_track.onclick = function (evt) {
        if (!isHandleClicked) {
            evt = (evt) ? evt : event;
            pxTop = scrollbar_handle.offsetTop // Sliders vertical position at start of slide.
            var offsetY;
            if (!evt.offsetY) {
                var coords = dojo.coords(evt.target);
                offsetY = evt.layerY - coords.t;
            }
            else
                offsetY = evt.offsetY;
            if (offsetY < scrollbar_handle.offsetTop) {
                scrollbar_handle.style.top = offsetY + "px";
                content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
            }
            else if (offsetY > (scrollbar_handle.offsetTop + scrollbar_handle.clientHeight)) {
                var y = offsetY - scrollbar_handle.clientHeight;
                if (y > yMax) y = yMax // Limit vertical movement
                if (y < 0) y = 0 // Limit vertical movement
                scrollbar_handle.style.top = y + "px";
                content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
            }
            else {
                return;
            }
        }
        isHandleClicked = false;
    };

    //Attaching events to scrollbar components
    scrollbar_handle.onmousedown = function (evt) {
        isHandleClicked = true;
        evt = (evt) ? evt : event;
        evt.cancelBubble = true;
        if (evt.stopPropagation) evt.stopPropagation();
        pxTop = scrollbar_handle.offsetTop // Sliders vertical position at start of slide.
        yCoord = evt.screenY // Vertical mouse position at start of slide.
        document.body.style.MozUserSelect = 'none';
        document.body.style.userSelect = 'none';
        document.onselectstart = function () {
            return false;
        }
        document.onmousemove = function (evt) {
            console.log("inside mousemove");
            evt = (evt) ? evt : event;
            evt.cancelBubble = true;
            if (evt.stopPropagation) evt.stopPropagation();
            var y = pxTop + evt.screenY - yCoord;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
    };

    document.onmouseup = function () {
        document.body.onselectstart = null;
        document.onmousemove = null;
    };

    scrollbar_handle.onmouseout = function (evt) {
        document.body.onselectstart = null;
    };
}
//Function for displaying loading image in comments tab
function ShowDojoLoading(target) {
    dijit.byId('dojoStandBy').target = target;
    dijit.byId('dojoStandBy').show();
}

//Function for hiding loading image
function HideDojoLoading() {
    dijit.byId('dojoStandBy').hide();
}

//function to find custom anchor point
function GetInfoWindowAnchor(pt, infoWindowWidth) {
    var verticalAlign;
    if (pt.y < map.height / 2) {
        verticalAlign = "LOWER";
    }
    else {
        verticalAlign = "UPPER";
    }
    if ((pt.x + infoWindowWidth) > map.width) {
        return esri.dijit.InfoWindow["ANCHOR_" + verticalAlign + "LEFT"];
    }
    else {
        return esri.dijit.InfoWindow["ANCHOR_" + verticalAlign + "RIGHT"];
    }
}

//Function for toggling the search according to service request or address
function ToggleSearch(control) {
    if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
        if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
            WipeOutControl(dojo.byId('divAddressContainer'), 500);
        }
    }
    if (!(dojo.byId('txtAddress').disabled)) {
        if (control.id == 'spanAddress') {
            dijit.byId('imgGeolocation').domNode.style.visibility = 'visible';
            SetSearchControlFields(dojo.byId('spanParkActivity'), control, 'Enter an address to locate', defaultAddress, 'rbAddress');
        }
        else {
            dijit.byId('imgGeolocation').domNode.style.visibility = 'hidden';
            if (dojo.byId('divAddressContainer').children.length != 0) {
                if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
                    WipeOutControl(dojo.byId('divAddressContainer'), 500);
                }
                setTimeout(function () { RemoveChildren(dojo.byId('divAddressContainer')); }, 500);
            }
            else {
                dojo.byId('divAddressContainer').style.display = 'none';
            }
            SetSearchControlFields(dojo.byId('spanAddress'), control, 'Enter park or activity name', "Enter park or activity name", 'rbParkActivity');
        }
    }
}

//function to set search controls
function SetSearchControlFields(spandisabled, spanenabled, title, value, rbControl) {
    spandisabled.className = "disabledText";
    spanenabled.className = "text";
    dojo.byId("txtAddress").title = title;
    dojo.byId("txtAddress").value = value;
    dojo.byId(rbControl).checked = true;
}

//function to teggle search from radio button click
function RadioButtonClicked() {
    if (dojo.byId("rbAddress").checked) {
        dijit.byId('imgGeolocation').domNode.style.visibility = 'visible';
        SetSearchControlFields(dojo.byId('spanParkActivity'), dojo.byId('spanAddress'), 'Enter an address to locate', defaultAddress, 'rbAddress');
    }
    else {
        dijit.byId('imgGeolocation').domNode.style.visibility = 'hidden';
        if (dojo.byId('divAddressContainer').children.length != 0) {
            if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
                WipeOutControl(dojo.byId('divAddressContainer'), 500);
            }
            setTimeout(function () { RemoveChildren(dojo.byId('divAddressContainer')); }, 500);
        }
        else {
            dojo.byId('divAddressContainer').style.display = 'none';
        }
        SetSearchControlFields(dojo.byId('spanAddress'), dojo.byId('spanParkActivity'), 'Enter park or activity name', "Enter park or activity name", 'rbParkActivity');
    }
}

//Function to clear default value
function ClearDefaultText(e) {
    var target = window.event ? window.event.srcElement : e ? e.target : null;
    if (!target) return;

    if (target.value == target.title) {
        target.value = '';
    }
}

//Function to set default value
function ReplaceDefaultText(e) {
    var target = window.event ? window.event.srcElement : e ? e.target : null;
    if (!target) return;

    if (target.value == '' && target.title) {
        target.value = target.title;
    }
}

//function to close maptip
function CloseMapTip() {
    if (dijit.byId('toolTipDialog')) {
        dijit.byId('toolTipDialog').destroy();
    }
}

//function to show maptip
function ShowMapTip(evtArgs, content) {
    CloseMapTip();
    var dialog = new dijit.TooltipDialog({
        id: "toolTipDialog",
        content: '<span style="font-size:11px; font-family:Verdana;">' + content + '</span> ',
        style: "position: absolute; z-index:1000;"
    });
    dialog.startup();
    dojo.style(dialog.domNode, "opacity", 0.80);
    dijit.placeOnScreen(dialog.domNode, { x: evtArgs.pageX, y: evtArgs.pageY }, ["BL", "BR"], { x: 5, y: 5 });
}

//function for displaying the current location with buffer region
function ShowMyLocation(evt) {
    if (dijit.byId('imgGeolocation').checked) {
        if (evt.id == 'imgGeolocation') {
            dojo.byId('rbAddress').disabled = true;
            dojo.byId('rbParkActivity').disabled = true;
            dojo.byId('txtAddress').disabled = true;
            dojo.byId('spanAddress').style.cursor = 'default';
            dojo.byId('spanParkActivity').style.cursor = 'default';
            dojo.byId('txtAddress').title = '';
            dojo.byId('imgLocateAddress').style.cursor = 'default';
            dojo.byId('imgLocateAddress').title = '';
            if (dojo.byId('spanAddress').className == 'text') {
                dojo.byId('spanAddress').className = 'disabledText';
            }
            else {
                dojo.byId('spanParkActivity').className = 'disabledText';
            }
            if (dojo.byId('divAddressContainer').children.length != 0) {
                if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
                    WipeOutControl(dojo.byId('divAddressContainer'), 500);
                }
                setTimeout(function () { RemoveChildren(dojo.byId('divAddressContainer')); }, 500);
            }
            else {
                dojo.byId('divAddressContainer').style.display = 'none';
            }
        }
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
		function (position) {
		    ShowLoadingMessage("Finding your current location...");
		    mapPoint = new esri.geometry.Point(position.coords.longitude, position.coords.latitude, new esri.SpatialReference({ wkid: 4326 }));
		    var graphicCollection = new esri.geometry.Multipoint(new esri.SpatialReference({ wkid: 4326 }));
		    graphicCollection.addPoint(mapPoint);
		    geometryService.project([graphicCollection], map.spatialReference, function (newPointCollection) {
		        HideLoadingMessage();
		        if (!map.getLayer(baseMapLayerCollection[0].Key).fullExtent.contains(newPointCollection[0].getPoint(0))) {
		            ShowDialog('Error', messages.getElementsByTagName("geoLocation")[0].childNodes[0].nodeValue);
		            return;
		        }
		        mapPoint = newPointCollection[0].getPoint(0);
		        DisplayingPoint(evt, mapPoint);
		    });
		},
		function (error) {
		    HideLoadingMessage();
		    switch (error.code) {
		        case error.TIMEOUT:
		            ShowDialog('Error', messages.getElementsByTagName("geolocationTimeout")[0].childNodes[0].nodeValue);
		            break;
		        case error.POSITION_UNAVAILABLE:
		            ShowDialog('Error', messages.getElementsByTagName("geolocationPositionUnavailable")[0].childNodes[0].nodeValue);
		            break;
		        case error.PERMISSION_DENIED:
		            ShowDialog('Error', messages.getElementsByTagName("geolocationPermissionDenied")[0].childNodes[0].nodeValue);
		            break;
		        case error.UNKNOWN_ERROR:
		            ShowDialog('Error', messages.getElementsByTagName("geolocationUnKnownError")[0].childNodes[0].nodeValue);
		            break;
		    }
		}, { timeout: 10000 });
        }
    }
    else {
        if (evt.id == 'imgGeolocation') {
            dojo.byId('rbAddress').disabled = false;
            dojo.byId('rbParkActivity').disabled = false;
            dojo.byId('txtAddress').disabled = false;
            dojo.byId('spanAddress').style.cursor = 'pointer';
            dojo.byId('spanParkActivity').style.cursor = 'pointer';
            dojo.byId('imgLocateAddress').style.cursor = 'pointer';
            dojo.byId('imgLocateAddress').title = 'Search';
            if (dojo.byId('rbAddress').checked) {
                dojo.byId('spanAddress').className = 'text';
                dojo.byId('txtAddress').title = 'Enter an address to locate';
            }
            else {
                dojo.byId('spanParkActivity').className = 'disabledText';
                dojo.byId('txtAddress').title = 'Enter a park or activity name to locate';
            }
        }
    }
}

//function for displaying the current location
function ShowCurrentLocation(evt) {
    if (dijit.byId('btnCurrentLocation').checked) {
        dojo.byId('txtDAddress').disabled = true;
        dojo.byId('txtDAddress').title = '';
        dojo.byId('directionSearch').style.cursor = 'default';
        dojo.byId('directionSearch').title = '';
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
		function (position) {
		    ShowLoadingMessage("Finding your current location...");
		    mapPoint = new esri.geometry.Point(position.coords.longitude, position.coords.latitude, new esri.SpatialReference({ wkid: 4326 }));
		    var graphicCollection = new esri.geometry.Multipoint(new esri.SpatialReference({ wkid: 4326 }));
		    graphicCollection.addPoint(mapPoint);
		    geometryService.project([graphicCollection], map.spatialReference, function (newPointCollection) {
		        HideLoadingMessage();
		        if (!map.getLayer(baseMapLayerCollection[0].Key).fullExtent.contains(mapPoint)) {
		            ShowDialog('Error', messages.getElementsByTagName("geoLocation")[0].childNodes[0].nodeValue);
		            return;
		        }
		        mapPoint = newPointCollection[0].getPoint(0);
		        DisplayingPoint(evt, mapPoint);
		    });
		},
		function (error) {
		    HideLoadingMessage();
		    switch (error.code) {
		        case error.TIMEOUT:
		            ShowDialog('Error', messages.getElementsByTagName("geolocationTimeout")[0].childNodes[0].nodeValue);
		            break;
		        case error.POSITION_UNAVAILABLE:
		            ShowDialog('Error', messages.getElementsByTagName("geolocationPositionUnavailable")[0].childNodes[0].nodeValue);
		            break;
		        case error.PERMISSION_DENIED:
		            ShowDialog('Error', messages.getElementsByTagName("geolocationPermissionDenied")[0].childNodes[0].nodeValue);
		            break;
		        case error.UNKNOWN_ERROR:
		            ShowDialog('Error', messages.getElementsByTagName("geolocationUnKnownError")[0].childNodes[0].nodeValue);
		            break;
		    }
		}, { timeout: 10000 });
        }
    }
    else {
        dojo.byId('txtDAddress').disabled = false;
        dojo.byId('txtDAddress').title = 'Enter an address to locate';
        dojo.byId('directionSearch').style.cursor = 'pointer';
        dojo.byId('directionSearch').title = 'Search';
    }
}

//function for displaying a map point on the map
function DisplayingPoint(evt, mapPoint) {
    map.getLayer(tempGraphicsLayerId).clear();
    var symbol = new esri.symbol.PictureMarkerSymbol(locatorMarkupSymbolPath, 22, 22);
    var locator = new esri.tasks.Locator(locatorURL);
    locator.outSpatialReference = map.spatialReference;
    locator.locationToAddress(mapPoint, 1000, function (candidate) {
        if (candidate.address) {
            map.getLayer(tempGraphicsLayerId).graphics[0].attributes = { Address: candidate.address.Address + ", " + candidate.address.City + ", " + candidate.address.State + ", " + candidate.address.Zip };
        }
    });
    var graphic = new esri.Graphic(mapPoint, symbol, null, null);
    map.getLayer(tempGraphicsLayerId).add(graphic);
    if (evt.id == 'imgGeolocation') {
        DoBuffer(bufferDistance, mapPoint);
    }
    else {
        ConfigureRoute(mapPoint);
    }
}

//funtion for adding the graphic on map
function AddGraphic(layer, symbol, point, attr) {
    var graphic = new esri.Graphic(point, symbol, attr, null);
    var features = [];
    features.push(graphic);
    var featureSet = new esri.tasks.FeatureSet();
    featureSet.features = features;
    layer.add(featureSet.features[0]);
}

//function for clearing the buffer graphics
function ClearBuffer() {
    var layer = map.getLayer(tempBufferLayer);
    if (layer) {
        var count = layer.graphics.length;
        for (var i = 0; i < count; i++) {
            var graphic = layer.graphics[i];
            if (graphic.geometry.type == 'polygon') {
                layer.remove(graphic);
            }
        }
    }
}

//function for displaying an info window their activities of that particular park
function ShowInfoWindow(feature, point) {
    newInfoLeftOffice = 0;
    var attributes = feature.attributes;
    var spanTitle = document.createElement("span");
    spanTitle.className = "infoTitle";
    spanTitle.id = "spanInfoWindowTitle";
    var title = feature.attributes[infoWindowHeader[0].FieldName];
    if (title.length > 30) {
        spanTitle.title = title;
    }
    spanTitle.innerHTML = title.trimString(30);
    map.infoWindow.setTitle(spanTitle);
    var devPlanLayer = map.getLayer(devPlanLayerID);
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
    var container = document.createElement('div');
    container.id = "scrollbar_container";
    container.style.overflow = "hidden";
    container.style.height = infoWindowHeight - 40 + "px";

    var divInfoWindow = document.createElement("div");
    divInfoWindow.id = "divInfoWindow";
    divInfoWindow.style.overflow = "hidden";
    divInfoWindow.style.height = infoWindowHeight - 40 + "px";
    divInfoWindow.style.width = "240px";
    divInfoWindow.className = 'scrollbar_content';

    var table = document.createElement("table");
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    table.id = "tblParcels";
    table.cellSpacing = 0;
    table.cellPadding = 0;
    table.style.width = "100%";
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
                if (devPlanLayer.fields[i].name == infoPopupFieldsCollection[key].FieldName) {
                    td1.innerHTML = devPlanLayer.fields[i].alias + ':';
                }
            }
        }
        td1.height = 20;

        var td2 = document.createElement("td");
        td2.height = 20;
        td2.style.paddingLeft = '5px';
        if (feature.attributes[infoPopupFieldsCollection[key].FieldName] != "-") {
            td2.innerHTML = feature.attributes[infoPopupFieldsCollection[key].FieldName];
        }
        else {
            td2.innerHTML = displayValue;
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
    tdAct.appendChild(tableAct);
    var tbodyAct = document.createElement('tbody');
    tableAct.appendChild(tbodyAct);
    var trAct = document.createElement('tr');
    tbodyAct.appendChild(trAct);

    var tdLeft = document.createElement('td');
    tdLeft.id = 'tdInfoLeftArrow';
    var divArr = document.createElement('div');
    divArr.id = 'divInfoLeftArrow';
    divArr.style.width = "20px";
    divArr.innerHTML = "<img src='images/disabledArrowLeft.png' class='disabledText' id='infoLeftArrow' style='height:20px;display:none'/>";
    divArr.onclick = function () {
        SlideInfoLeft();
    }
    tdLeft.appendChild(divArr);
    trAct.appendChild(tdLeft);

    var tdAct = document.createElement('td');
    tdAct.style.width = infoWindowWidth - 81 + "px";
    tdAct.style.height = '27px';
    trAct.appendChild(tdAct);
    var divAct = document.createElement('div');
    divAct.id = 'divInfoActData';
    divAct.style.position = 'relative';
    divAct.style.overflow = 'hidden';
    divAct.style.width = '100%';
    divAct.style.height = '100%';
    divAct.style.float = 'left';
    tdAct.appendChild(divAct);
    var divScroll = document.createElement('div');
    divScroll.id = 'divInfoScroll';
    divScroll.style.float = 'left';
    divScroll.style.position = 'absolute';
    divAct.appendChild(divScroll);
    var divActContainer = document.createElement('div');
    divActContainer.id = 'divInfoActContainer';
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
        if (feature.attributes[infoActivity[j].FieldName] == "Yes") {
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
    divAr.id = 'divInfoRightArrow';
    divAr.style.width = '20px';
    divAr.innerHTML = "<img src='images/disabledArrowRight.png'  class='disabledText' id='infoRightArrow' style='height:20px;display:none'/>";
    divAr.onclick = function () {
        SlideInfoRight();
    }
    tdRight.appendChild(divAr);
    trAct.appendChild(tdRight);

    divInfoWindow.appendChild(table);
    container.appendChild(divInfoWindow);
    map.infoWindow.setContent(container);
    map.infoWindow.resize(infoWindowWidth, infoWindowHeight);
    var windowPoint = map.toScreen(feature.geometry);
    map.infoWindow.show(windowPoint, map.getInfoWindowAnchor(windowPoint, 395));
    setTimeout(function () {
        if (dojo.byId('divInfoActData').offsetWidth < dojo.byId('divInfoScroll').offsetWidth) {
            dojo.byId('infoRightArrow').src = 'images/arrRight.png';
            dojo.byId('infoRightArrow').style.cursor = 'pointer';
            dojo.byId('infoLeftArrow').style.display = 'block';
            dojo.byId('infoLeftArrow').style.cursor = 'default';
            dojo.byId('infoRightArrow').style.display = 'block';
        }
        else {
            dojo.byId('infoRightArrow').src = 'images/disabledArrowRight.png';
            dojo.byId('infoRightArrow').style.cursor = 'default';
            dojo.byId('tdInfoLeftArrow').style.display = 'none';
            dojo.byId('divInfoLeftArrow').style.display = 'none';
            dojo.byId('divInfoRightArrow').style.display = 'none';
        }
    }, 80);
    CreateInfoWindowScrollbar();
}

//function for creating a scrollbar at info window
function CreateInfoWindowScrollbar() {
    CreateScrollbar(dojo.byId("scrollbar_container"), dojo.byId("divInfoWindow"));
    dojo.byId("scrollbar_containerscrollbar_track").style.top = dojo.coords(dojo.byId('scrollbar_container')).t + "px";
    dojo.byId("scrollbar_containerscrollbar_track").style.right = 3 + "px";
    dojo.byId("scrollbar_containerscrollbar_track").style.backgroundColor = "#666666";
}

//function for clearing all the graphic layers that are on the map
function ClearAll() {
    map.graphics.clear();
    map.getLayer(tempBufferLayer).clear();
    map.getLayer(highlightPollLayerId).clear();
    HideRipple();
    map.getLayer(tempGraphicsLayerId).clear();
    mapPoint = '';
}

//function for sliding right for horizontal scroll
function SlideRight() {
    var difference = dojo.byId('divActData').offsetWidth - dojo.byId('divScroll').offsetWidth;
    if (newLeftOffice > difference) {
        dojo.byId('idLeftArrow').src = "images/arrLeft.PNG";
        dojo.byId('idLeftArrow').style.cursor = 'pointer';
        var node = dojo.byId('divScroll');
        newLeftOffice = newLeftOffice - (28);
        var anim1 = dojo.animateProperty({
            node: node,
            duration: 500,
            properties: {
                left: { end: newLeftOffice, unit: "px" }
            }
        });
        animG = dojo.fx["chain"]([anim1]).play();
        if (newLeftOffice < difference) {
            dojo.byId('idRightArrow').src = 'images/disabledArrowRight.png';
            dojo.byId('idRightArrow').className = 'disabledText';
            dojo.byId('idRightArrow').style.cursor = 'default';
        }
        if (dojo.byId('idRightArrow').className == 'disabledText') {
            dojo.byId('idLeftArrow').src = 'images/arrLeft.PNG';
            dojo.byId('idLeftArrow').style.cursor = 'pointer';
            dojo.byId('idLeftArrow').style.display = 'block';
        }
    }
}

//function for sliding left for horizontal scroll
function SlideLeft() {
    if (newLeftOffice < 0) {
        if (newLeftOffice > -(28)) {
            newLeftOffice = 0;
        }
        else {
            newLeftOffice = newLeftOffice + (28);
        }
        var node = dojo.byId('divScroll');
        var anim1 = dojo.animateProperty({
            node: node,
            duration: 500,
            properties: {
                left: { end: newLeftOffice, unit: "px" }
            }
        });
        animG = dojo.fx["chain"]([anim1]).play();
        if (dojo.byId('idRightArrow').className == 'disabledText') {
            dojo.byId('idRightArrow').src = 'images/arrRight.png';
            dojo.byId('idRightArrow').style.cursor = 'pointer';
        }
        if (newLeftOffice == 0) {
            dojo.byId('idLeftArrow').src = 'images/disabledArrowLeft.png';
            dojo.byId('idLeftArrow').style.cursor = 'default';
            dojo.byId('idLeftArrow').style.display = 'block';
        }
    }
}

//function for sliding right for horizontal scroll at info window
function SlideInfoRight() {
    var differenceInfo = dojo.byId('divInfoActData').offsetWidth - dojo.byId('divInfoScroll').offsetWidth;
    if (newInfoLeftOffice > differenceInfo) {
        dojo.byId('infoLeftArrow').src = "images/arrLeft.PNG";
        dojo.byId('infoLeftArrow').style.cursor = 'pointer';
        var node = dojo.byId('divInfoScroll');
        newInfoLeftOffice = newInfoLeftOffice - (28);
        var anim1 = dojo.animateProperty({
            node: node,
            duration: 500,
            properties: {
                left: { end: newInfoLeftOffice, unit: "px" }
            }
        });
        animG = dojo.fx["chain"]([anim1]).play();
        if (newInfoLeftOffice < differenceInfo) {
            dojo.byId('infoRightArrow').src = 'images/disabledArrowRight.png';
            dojo.byId('infoRightArrow').style.cursor = 'default';
            dojo.byId('infoRightArrow').className = 'disabledText';
        }
        if (dojo.byId('infoRightArrow').className == 'disabledText') {
            dojo.byId('infoLeftArrow').src = 'images/arrLeft.PNG';
            dojo.byId('infoLeftArrow').style.cursor = 'pointer';
            dojo.byId('infoLeftArrow').style.display = 'block';
        }
    }
}

//function for sliding left for horizontal scroll at info window
function SlideInfoLeft() {
    if (newInfoLeftOffice < 0) {
        if (newInfoLeftOffice > -(28)) {
            newInfoLeftOffice = 0;
        }
        else {
            newInfoLeftOffice = newInfoLeftOffice + (28);
        }
        var node = dojo.byId('divInfoScroll');
        var anim1 = dojo.animateProperty({
            node: node,
            duration: 500,
            properties: {
                left: { end: newInfoLeftOffice, unit: "px" }
            }
        });
        animG = dojo.fx["chain"]([anim1]).play();
        if (dojo.byId('infoRightArrow').className == 'disabledText') {
            dojo.byId('infoRightArrow').src = 'images/arrRight.png';
            dojo.byId('infoRightArrow').style.cursor = 'pointer';
        }
        if (newInfoLeftOffice == 0) {
            dojo.byId('infoLeftArrow').src = 'images/disabledArrowLeft.png';
            dojo.byId('infoLeftArrow').style.cursor = 'default';
            dojo.byId('infoLeftArrow').style.display = 'block';
        }
    }
}

//function for glowing the ripple
function GlowRipple(glowPoint) {
    if (glowPoint == null) {
        return;
    }
    var layer = map.getLayer(highlightPollLayerId);
    var i = 8;
    var inc = true;
    var dec = false;
    var intervalID = setInterval(function () {
        layer.clear();
        if (i == 14) {
            inc = false;
        }
        else
            if (i == 8) {
                inc = true;
            }
        var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, (i - 1) * 4, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color(rippleColor), 4), new dojo.Color([0, 0, 0, 0]));
        var graphic = new esri.Graphic(glowPoint, symbol, null, null);
        var features = [];
        features.push(graphic);
        var featureSet = new esri.tasks.FeatureSet();
        featureSet.features = features;
        layer.add(featureSet.features[0]);
        if (inc) {
            rippleColor[3] = (i * 0.05);
            i++;
        }
        else {
            rippleColor[3] = (i * 0.10);
            i--;
        }
    }, 100);
    intervalIDs[intervalIDs.length] = intervalID;
}

//function for clearing the intervals for ripple
function ClearAllIntervals() {
    for (var i = 0; i < intervalIDs.length; i++) {
        clearTimeout(intervalIDs[i]);
        delete intervalIDs[i];
    }
    intervalIDs.length = 0;
}

//function for hiding the ripple
function HideRipple() {
    ClearAllIntervals();
    ClearRippleGraphics();
}

//function for clearing the ripple graphics
function ClearRippleGraphics(eventArgs) {
    var layer = map.getLayer(highlightPollLayerId);
    if (layer != null) {
        layer.clear();
    }
}

//Function to Calculate distance betwwen two mapPoints
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
    distance = (dist * 10) / 10;
}

//function for converting degrees to radians
function Deg2Rad(deg) {
    return (deg * Math.PI) / 180.0;
}

//function for converting radians to degrees
function Rad2Deg(rad) {
    return (rad / Math.PI) * 180.0;
}

//function to validate US ZIP code
function isValidZipCode(value) {
    var re = /^\d{5}([\-]\d{4})?$/;
    return re.test(value);
}

//function to hide BaseMapWidget onmouseout
function HideBaseMapWidget() {
    dijit.byId('imgBaseMap').attr("checked", false);
    var node = dojo.byId('divBaseMapTitleContainer');
    if (dojo.coords(node).h > 0) {
        WipeOutControl(node, 500);
    }
}

//function to hide application share widget onmouseout
function HideApplicationShareWidget() {
    dijit.byId('imgapplink').attr("checked", false);
    var node = dojo.byId('divAppContainer');
    if (dojo.coords(node).h > 0) {
        WipeOutControl(node, 500);
    }
}

var customMouseHandler =
{
    evtHash: [],

    ieGetUniqueID: function (_elem) {
        if (_elem === window) { return 'theWindow'; }
        else if (_elem === document) { return 'theDocument'; }
        else { return _elem.uniqueID; }
    },

    addEvent: function (_elem, _evtName, _fn, _useCapture) {
        if (typeof _elem.addEventListener != 'undefined') {
            if (_evtName == 'mouseenter')
            { _elem.addEventListener('mouseover', customMouseHandler.mouseEnter(_fn), _useCapture); }
            else if (_evtName == 'mouseleave')
            { _elem.addEventListener('mouseout', customMouseHandler.mouseEnter(_fn), _useCapture); }
            else
            { _elem.addEventListener(_evtName, _fn, _useCapture); }
        }
        else if (typeof _elem.attachEvent != 'undefined') {
            var key = '{FNKEY::obj_' + customMouseHandler.ieGetUniqueID(_elem) + '::evt_' + _evtName + '::fn_' + _fn + '}';
            var f = customMouseHandler.evtHash[key];
            if (typeof f != 'undefined')
            { return; }

            f = function () {
                _fn.call(_elem);
            };

            customMouseHandler.evtHash[key] = f;
            _elem.attachEvent('on' + _evtName, f);

            // attach unload event to the window to clean up possibly IE memory leaks
            window.attachEvent('onunload', function () {
                _elem.detachEvent('on' + _evtName, f);
            });

            key = null;
            //f = null;   /* DON'T null this out, or we won't be able to detach it */
        }
        else
        { _elem['on' + _evtName] = _fn; }
    },

    removeEvent: function (_elem, _evtName, _fn, _useCapture) {
        if (typeof _elem.removeEventListener != 'undefined')
        { _elem.removeEventListener(_evtName, _fn, _useCapture); }
        else if (typeof _elem.detachEvent != 'undefined') {
            var key = '{FNKEY::obj_' + customMouseHandler.ieGetUniqueID(_elem) + '::evt' + _evtName + '::fn_' + _fn + '}';
            var f = customMouseHandler.evtHash[key];
            if (typeof f != 'undefined') {
                _elem.detachEvent('on' + _evtName, f);
                delete customMouseHandler.evtHash[key];
            }

            key = null;
            //f = null;   /* DON'T null this out, or we won't be able to detach it */
        }
    },

    mouseEnter: function (_pFn) {
        return function (_evt) {
            var relTarget = _evt.relatedTarget;
            if (this == relTarget || customMouseHandler.isAChildOf(this, relTarget))
            { return; }

            _pFn.call(this, _evt);
        }
    },

    isAChildOf: function (_parent, _child) {
        if (_parent == _child) { return false };

        while (_child && _child != _parent)
        { _child = _child.parentNode; }

        return _child == _parent;
    }
};

//Function to get the query string value of the provided key if not found the function returns empty string
function GetQuerystring(key) {
    var _default;
    if (_default == null) _default = "";
    key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
    var qs = regex.exec(window.location.href);
    if (qs == null)
        return _default;
    else
        return qs[1];
}



