dojo.provide("js.date");
dojo.declare("js.date", null, {

    // Veneer for JavaScript Date object that emphasizes that one is working with local time
    localTimestampNow: function () {  // returns Date
        return new Date();
    },

    localTimestampFromMs: function (localMilliseconds) {  // returns Date
        return new Date(localMilliseconds);
    },

    localMsFromTimestamp: function (localTimestamp) {  // returns Number
        return localTimestamp.getTime();
    },

    // Veneer for JavaScript Date object that emphasizes that one is working with UTC time
    utcTimestampNow: function () {  // returns Date
        return this.localToUtc(this.localTimestampNow());
    },

    utcTimestampFromMs: function (utcMilliseconds) {  // returns Date
        return this.localToUtc(new Date(utcMilliseconds));
    },

    utcMsFromTimestamp: function (utcTimestamp) {  // returns Number
        return this.utcToLocal(utcTimestamp).getTime();
    },

    // Convert timestamps from local to UTC and back
    localToUtc: function (localTimestamp) {  // returns Date
        return new Date(localTimestamp.getTime() + (localTimestamp.getTimezoneOffset() * 60000));
    },

    utcToLocal: function (utcTimestamp) {  // returns Date
        return new Date(utcTimestamp.getTime() - (utcTimestamp.getTimezoneOffset() * 60000));
    }

})
