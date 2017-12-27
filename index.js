exports.handler = (event, context, callback) => {

    const c = context;
    var AWS = require('aws-sdk');
    var http = require('http');
    var request = require('request').defaults({
        encoding: null
    });

    var s3 = new AWS.S3();
    var rekognition = new AWS.Rekognition({
        apiVersion: '2016-06-27',
        region: process.env.AWS_REGION
    });

    // things you configure
    var snsarn = 'arn:aws:sns:us-east-1:127362029329:bringinthewashing';
    var knownItems = ['Backyard', 'Outdoors', 'Yard', 'Bench', 'Park Bench', 'Flora', 'Plant', 'Tree', 'Park',
        'Forest', 'Grove', 'Land', 'Nature', 'Vegetation', 'Pond', 'Water', 'Blossom', 'Path',
        'Pavement', 'Cherry Blossom', 'Flora', 'Flower', 'Plant', 'Fence', 'Lilac', 'Hedge', 'Harbor',
        'Port', 'Waterfront', 'Nature', 'Conifer', 'Urban', 'Flower Arrangement', 'Grove', 'Wilderness', '',
        'Ornament', 'Jar', 'Potted Plant', 'Pottery', 'Vase', 'Vine', 'Sidewalk', 'Ivy', 'Yew',
        'Oak', 'Sycamore', 'Moss', 'Grass', 'Lupin', 'Resort', 'Hotel', 'Building', 'Flagstone',
        'Bonsai', 'Tarmac', 'Walkway', 'Trail', 'Office Building', 'Aisle', 'Indoors', 'Human', 'People',
        'Person', 'Intersection', 'Road', 'Garden', 'Architecture', 'Asphalt', 'Soil', 'Patio', 'Alley', 'Alleyway'
    ];

    // grab photo from camera
    var url = 'http://n.triso.me:1400/snap.jpeg';
        //url = 'http://n.triso.me/stuff/capture-6.jpg';
        url = 'https://i.imgur.com/cUGEYbl.jpg';
    request.get(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var params = {
                Image: {
                    Bytes: body
                },
                MaxLabels: 20,
                MinConfidence: 50.0
            };

            rekognition.detectLabels(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                } else {
                    var found = 0; // have we found anything?
                    var notify = 0; // should we notify someone?
                    var items = ""; // list of items we found

                    // iterate through all of the labels that were found for this image
                    var labels = data.Labels;
                    var key = 'Name';
                    // loop through all keys (labels) that were detected, using the key of 'Name'
                    for (key in labels) {
                        found = 0;
                        // loop through knownItems to see if anything matches
                        for (var x = 0; x < knownItems.length; x++) {
                            if (knownItems[x] == labels[key].Name) { // if something matches, lets record it with the found variable
                                found = 1;
                            }
                        }
                        if (found == 0) { // if we get here, the loop had no matching knownItem for the key we're checking. this means something was found.
                            if (notify == 1) // formatting
                                items += ',';
                            items += " " + labels[key].Name; // record what was found so we can email it to the user
                            notify = 1; // confirm we're going to send a notification

                        }
                    }

                    // if we've confirmed we found something
                    if (notify == 1) {
                        items = items.replace(/,\s([^,]+)$/, ' and $1'); // replace last comma with 'and' to make it sound nice.
                        c.succeed("Yes you have something on your clothes line! I found" + items);
                    } else { 
                        c.succeed("I didn't find any washing on the line");
                    }
                }
            });
        }
    });
};