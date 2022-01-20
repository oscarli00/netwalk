const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
exports.scheduledFunction = functions.pubsub.schedule("every monday 00:00").onRun((context) => {
    admin.database().ref().once("value", function (snapshot) {
        snapshot.forEach(function (child) {
            child.ref.remove();
        });
    })
    return null;
});