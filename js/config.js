/*global dojo */
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
dojo.provide("js.Config");
dojo.declare("js.Config", null, {

    // This file contains various configuration settings for "Parks And Recreation Finder" template
    //
    // Use this file to perform the following:
    //
    // 1.  Specify application title                  - [ Tag(s) to look for: ApplicationName ]
    // 2.  Set path for application icon              - [ Tag(s) to look for: ApplicationIcon ]
    // 3.  Set splash screen message                  - [ Tag(s) to look for: SplashScreenMessage ]
    // 4.  Set URL for help page                      - [ Tag(s) to look for: HelpURL ]
    //
    // 5.  Specify URLs for basemaps                  - [ Tag(s) to look for: BaseMapLayers ]
    // 6.  Set initial map extent                     - [ Tag(s) to look for: DefaultExtent ]
    //
    // 7.  Tags for using map services:
    // 7a. Specify URLs and attributes for operational layers
    //                                                - [ Tag(s) to look for: DevPlanLayer,ParkActivitiesLayer,ParkCommentsLayer,ReferenceOverlayLayer,FacilityId,ParkName ]
    // 7b. Customize info-Window settings             - [ Tag(s) to look for: InfoWindowHeader, InfoWindowContent ]
    // 7c. Customize info-Popup settings              - [ Tag(s) to look for: InfoPopupFieldsCollection, Activities ]
    // 7d. Customize activity search settings         - [ Tag(s) to look for: ActivitySearch ]
    // 7e. Customize info-Popup size                  - [ Tag(s) to look for: InfoPopupHeight, InfoPopupWidth ]
    // 7f. Customize data formatting                  - [ Tag(s) to look for: ShowNullValueAs, FormatDateAs ]
    //
    // 8. Customize buffer settings                   - [ Tag(s) to look for: BufferDistance,BufferColor ]
    // 9. Customize address search settings           - [ Tag(s) to look for: LocatorURL, LocatorNameFields, , LocatorDefaultAddress,LocatorDefaultPark, LocatorMarkupSymbolPath, AddressMatchScore,LocatorRippleSize ]
    //LocatorFields
    // 10. Set URL for geometry service                - [ Tag(s) to look for: GeometryService ]
    //
    // 11. Customize routing settings for directions  - [ Tag(s) to look for: RouteServiceURL, RouteColor, RouteWidth, RippleColor, GetDirections ]
    //
    // 12. Configure data to be displayed on the bottom panel
    //                                                - [ Tag(s) to look for: InfoBoxWidth]
    //
    // 13. Specify URLs for map sharing               - [ Tag(s) to look for: MapSharingOptions,TinyURLServiceURL, TinyURLResponseAttribute, FacebookShareURL, TwitterShareURL, ShareByMailLink ]
    //
    // 14. Set the sequence for info-pods             - [ Tag(s) to look for: Order]
    //
    // ------------------------------------------------------------------------------------------------------------------------
    // GENERAL SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set application title
    ApplicationName: "Park and Recreation Finder",

    // Set application icon path
    ApplicationIcon: "images/appIcon.png",

    // Set splash window content - Message that appears when the application starts
    SplashScreenMessage: "<b>Welcome to Park Finder</b> <br/> <hr/> <br/> The <b>Park Finder</b> application helps citizens locate a park or recreation facility and obtain information about recreation activities in their community.  <br/><br/>To locate a park, simply enter an address or activity in the search box, or use your current location. The park(s) or recreation area(s) will then be highlighted on the map and relevant information about available recreation activities presented to the user.<br/><br/>",
    // Set URL of help page/portal
    HelpURL: "help.htm",

    // ------------------------------------------------------------------------------------------------------------------------
    // BASEMAP SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set baseMap layers
    // Please note: All base-maps need to use the same spatial reference. By default, on application start the first base-map will be loaded
    BaseMapLayers: [{
        Key: "topoMap",
        ThumbnailSource: "images/topographic.jpg",
        Name: "Topographic",
        MapURL: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
    }, {
        Key: "parcelMap",
        ThumbnailSource: "images/parcel.png",
        Name: "Streets",
        MapURL: "http://arcgis-tenone2012-1974758903.us-west-1.elb.amazonaws.com/arcgis/rest/services/ParcelPublicAccess/MapServer"
    },{
        Key: "imageryMap",
        ThumbnailSource: "images/imagery.jpg",
        Name: "Imagery",
        MapURL: "http://arcgis-tenone2012-1974758903.us-west-1.elb.amazonaws.com/arcgis/rest/services/ImageryHybrid/MapServer"
    }],

    // Initial map extent. Use comma (,) to separate values and don t delete the last comma
    DefaultExtent: "-9816010,5123000,-9809970,5129500",

    // ------------------------------------------------------------------------------------------------------------------------
    // OPERATIONAL DATA SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------

    // Configure operational layers:
    //URL used for doing query task on the parks layer
    DevPlanLayer: "http://services.arcgis.com/b6gLrKHqgkQb393u/arcgis/rest/services/ParksTryItLive/FeatureServer/0",
    //Set the primary key attribute for parks
    PrimaryKeyForParks: "${FACILITYID}",

    //URL used for doing query task on the comments layer
    ParkCommentsLayer: "http://services.arcgis.com/b6gLrKHqgkQb393u/arcgis/rest/services/ParksTryItLive/FeatureServer/1",
    //Set the primary key attribute for comments
    PrimaryKeyForComments: "${FACILITYID}",

    //Set the name attribute for parks
    ParkName: "${NAME}",

    // ServiceUrl is the REST end point for the reference overlay layer
    // DisplayOnLoad setting is used to show or hide the reference overlay layer. Reference overlay will be shown when it is set to true

    ReferenceOverlayLayer: {
        ServiceUrl: "http://ec2-54-214-140-9.us-west-2.compute.amazonaws.com:6080/arcgis/rest/services/Trails/MapServer",
        DisplayOnLoad: true
    },

    // ------------------------------------------------------------------------------------------------------------------------
    // INFO-WINDOW SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Info-window is a small, two line popup that gets displayed on selecting a feature
    // Set Info-window title. Configure this with text/fields
    InfoWindowHeader: [{
        FieldName: "${NAME}",
        Alias: "Park Name"
    }],

    // Choose content/fields for the info window
    InfoWindowContent: [{
        FieldName: "${FULLADDR}",
        Alias: "Full Address"
    }],


    // ------------------------------------------------------------------------------------------------------------------------
    // INFO-POPUP SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Info-popup is a popup dialog that gets displayed on selecting a feature
    // Set the content to be displayed on the info-Popup. Define labels, field values, field types and field formats
    InfoPopupFieldsCollection: [{
        DisplayText: "Address:",
        FieldName: "${FULLADDR}",
        Alias: "Full Address"
    }, {
        DisplayText: "Days Open:",
        FieldName: "${OPERDAYS}",
        Alias: "Operational Days"
    }, {
        DisplayText: "Hours of Operation:",
        FieldName: "${OPERHOURS}",
        Alias: "Operational Hours"
    }, {
        DisplayText: "Park Website:",
        FieldName: "${PARKURL}",
        Alias: "Website"
    }],

    //Activities to be displayed in info window for a park
    Activities: [{
        FieldName: "${RESTROOM}",
        Alias: "Restrooms Available",
        Image: "images/restrooms.png",
        isSelected: true
    }, {
        FieldName: "${ADACOMPLY}",
        Alias: "ADA Compliant",
        Image: "images/ada compliant.png"
    }, {
        FieldName: "${SWIMMING}",
        Alias: "Swimming",
        Image: "images/swimming.png"
    }, {
        FieldName: "${HIKING}",
        Alias: "Hiking",
        Image: "images/hiking.png"
    }, {
        FieldName: "${FISHING}",
        Alias: "Fishing",
        Image: "images/fishing.png"
    }, {
        FieldName: "${PICNIC}",
        Alias: "Picnic Shelters",
        Image: "images/picnic.png"
    }, {
        FieldName: "${BOATING}",
        Alias: "Boating",
        Image: "images/boating.png"
    }, {
        FieldName: "${ROADCYCLE}",
        Alias: "Road Cycling",
        Image: "images/cycling.png"
    }, {
        FieldName: "${MTBCYCLE}",
        Alias: "Mountain Biking",
        Image: "images/mtb.png"
    }, {
        FieldName: "${PLAYGROUND}",
        Alias: "Playgrounds",
        Image: "images/playground.png"
    }, {
        FieldName: "${SKI}",
        Alias: "Skiing",
        Image: "images/skiing.png"
    }, {
        FieldName: "${SOCCER}",
        Alias: "Multi-Purpose Fields",
        Image: "images/soccer.png"
    }, {
        FieldName: "${CAMPING}",
        Alias: "Camping",
        Image: "images/camping.png"
    }, {
        FieldName: "${HUNTING}",
        Alias: "Hunting",
        Image: "images/hunting.png"
    }, {
        FieldName: "${BASEBALL}",
        Alias: "Baseball Fields",
        Image: "images/baseball.png"
    }, {
        FieldName: "${BASKETBALL}",
        Alias: "Basketball Courts",
        Image: "images/basketball.png"
    }],

    // Set size of the info-Popup - select maximum height and width in pixels (not applicable for tabbed info-Popup)
    InfoPopupHeight: 270,
    InfoPopupWidth: 330,


    // Set string value to be shown for null or blank values
    ShowNullValueAs: "N/A",

    // Set date format
    FormatDateAs: "MMM dd, yyyy",

    //set distance in miles for drawing the buffer
    BufferDistance: "1",

    //set buffer color for address search
    BufferColor: [0, 100, 0],

    //Set the locator ripple size
    LocatorRippleSize: 34,

    //Set this variable to true/false to enable/disable using geolocation by default for Mobile/tablet
    GetDirectionsMobile: true,

    //Set this variable to true/false to enable/disable using geolocation by default for desktop
    GetDirectionsDesktop: false,

    //Set this variable to true/false to enable/disable directions
    //if this master variable is set to false directions cannot be enabled for any of the devices
    GetDirections: true,

    // ------------------------------------------------------------------------------------------------------------------------
    // ADDRESS SEARCH SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------

    // Set locator settings such as locator symbol, size, display fields, match score
    LocatorSettings: {
        DefaultLocatorSymbol: "images/RedPushpin.png",
        MarkupSymbolSize: {
            width: 35,
            height: 35
        },
        ZoomLevel: 18,
        Locators: [{
            DisplayText: "Location",
            LocatorDefaultAddress: "139 W Porter Ave Naperville IL 60540",
            LocatorParamaters: ["SingleLine"],
            LocatorURL: "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
            CandidateFields: "Loc_name, Score, Match_addr",
            DisplayField: "${Match_addr}",
            AddressMatchScore: 80,
            LocatorFieldName: "Loc_name",
            LocatorFieldValues: ["USA.StreetName" , "USA.PointAddress", "USA.StreetAddress"]
        }, {
            DisplayText: "Name",
            LocatorDefaultPark: "Knoch Park"
        }, {
            DisplayText: "Activity"
        }]
    },

    // Define the database field names
    // Note: DateFieldName refers to a date database field.
    // All other attributes refer to text database fields.
    DatabaseFields: {
        ParkIdFieldName: "FACILITYID",
        CommentsFieldName: "COMMENTS",
        DateFieldName: "SUBMITDT",
        RankFieldName: "RANK"
    },

    // Set info-pop fields for adding and displaying comment
    CommentsInfoPopupFieldsCollection: {
        Rank: "${RANK}",
        SubmitDate: "${SUBMITDT}",
        Comments: "${COMMENTS}"
    },

    // ------------------------------------------------------------------------------------------------------------------------
    // GEOMETRY SERVICE SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------

    // Set geometry service URL
    GeometryService: "http://arcgis-tenone2012-1974758903.us-west-1.elb.amazonaws.com/arcgis/rest/services/Utilities/Geometry/GeometryServer",

    // ------------------------------------------------------------------------------------------------------------------------
    // DRIVING DIRECTIONS SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set URL for routing service
    RouteServiceURL: "http://tasks.arcgisonline.com/ArcGIS/rest/services/NetworkAnalysis/ESRI_Route_NA/NAServer/Route",

    // Set color for the route symbol
    RouteColor: "#7F7FFE",

    // Set width of the route
    RouteWidth: 6,

    //set ripple color for selected feature
    RippleColor: [60, 72, 36],

    // ------------------------------------------------------------------------------------------------------------------------
    // SETTINGS FOR INFO-PODS ON THE BOTTOM PANEL
    // ------------------------------------------------------------------------------------------------------------------------
    // Set width of the pods in the bottom panel
    InfoBoxWidth: 422,

    // ------------------------------------------------------------------------------------------------------------------------
    // SETTINGS FOR MAP SHARING
    // ------------------------------------------------------------------------------------------------------------------------
    // Set URL for TinyURL service, and URLs for social media
    MapSharingOptions: {
        TinyURLServiceURL: "http://api.bit.ly/v3/shorten?login=esri&apiKey=R_65fd9891cd882e2a96b99d4bda1be00e&uri=${0}&format=json",
        TinyURLResponseAttribute: "data.url",

        FacebookShareURL: "http://www.facebook.com/sharer.php?u=${0}&t=Parks%20and%20Recreation%20Finder",
        TwitterShareURL: "http://mobile.twitter.com/compose/tweet?status=Parks%20and%20Recreation%20Finder ${0}",
        ShareByMailLink: "mailto:%20?subject=Checkout%20this%20map!&body=${0}"
    },
    // ------------------------------------------------------------------------------------------------------------------------
    // SETTINGS FOR INFOPODS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set sequence for info pods in the bottom panel
    Order: ["search", "park", "directions", "photogallery", "comments"]
});
