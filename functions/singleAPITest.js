var axios = require('axios');
var qs = require('qs');

exports.handler = function (context, event, callback) {

    console.log("step 1");
    var data = qs.stringify({
        'grant_type': 'password',
        'client_id': '3MVG9d8..z.hDcPLSXwrStZ.JUuYrO0hrlnr6NPPRZ587h5gjoQUvOpd5y8IKm6hvp7O9h7PPDlc7bTW1R68l',
        'client_secret': '7328123699008610703',
        'username': 'chris@twiliosfdc.dev',
        'password': '3paper-Hole-9safe'
    });

    console.log("step 2");
    var config = {
        method: 'post',
        url: 'https://login.salesforce.com/services/oauth2/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: data
    };

    console.log("step 3");
    axios(config)
        .then(function (response) {
            console.log("step 4" + response.data.access_token);
            //console.log(JSON.stringify(response.data));
            return callback(null, response);
        })
        .catch(function (error) {
            console.log("step 5");
            //console.log(error);
            return callback(error, null);
        });


}