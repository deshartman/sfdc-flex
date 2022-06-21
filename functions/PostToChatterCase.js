const axios = require('axios');

exports.handler = async function (context, event, callback) {
  let auth_url = "https://login.salesforce.com/services/oauth2/token";

  // URL Encode the POST body data
  const urlEncodedAuth_params = new URLSearchParams();
  urlEncodedAuth_params.append('grant_type', "password");
  urlEncodedAuth_params.append('client_id', process.env.SFDC_CLIENT_ID);
  urlEncodedAuth_params.append('client_secret', process.env.SFDC_CLIENT_SECRET);
  urlEncodedAuth_params.append('username', process.env.SFDC_USERNAME);
  urlEncodedAuth_params.append('password', process.env.SFDC_PASSWORD);

  let caseID = event.caseID;
  let bearer_token; // = event.bearer_token;

  console.log(`event: ${JSON.stringify(event, null, 4)}`);

  let query_url = "https://" + process.env.SFDC_INSTANCE_URL + "/services/data/v46.0/chatter/feed-elements?feedElementType=FeedItem&subjectId=" + caseID + "&text=New+post";

  var commentText = event.comment;
  var requestPayload = {
    "body": {
      "messageSegments": [
        {
          "type": "Text",
          "text": commentText
        }
      ]
    },
    "feedElementType": "FeedItem",
    "subjectId": caseID
  };

  console.log("requestPayload: " + JSON.stringify(requestPayload, null, 4));

  // First step is to get the token
  try {
    if (event.bearer_token) {
      console.log(`POST CHAT ALREADY HAVE A BEARER TOKEN`);
      bearer_token = event.bearer_token;
    } else {
      console.log(`Getting token with Auth Params ${urlEncodedAuth_params}`);

      axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
      const response = await axios.post(auth_url, urlEncodedAuth_params);

      console.log(`Got token: ${response.data.access_token}`);
      bearer_token = response.data.access_token;
    }
    // Set the token in the headers
    axios.defaults.headers.common = {
      'Authorization': 'Bearer ' + bearer_token,
    };
  } catch (error) {
    console.log(`Token Post Error: ${error}`);
    return callback(null, `SFDC get error: ${error}`)
  }

  // Now make the POST request with the bearer token
  try {
    // console.log(`Querying SFDC with query: ${query_url} and data: ${JSON.stringify(requestPayload,null,4)}`);
    const response = await axios.post(query_url, requestPayload);

    console.log('Got a response');
    return callback(null, {
      result: true
    });

  } catch (error) {
    console.log(`Query Error: ${error}`);

    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.statusText);
    console.log(error.response.headers);
    console.log(error.response.config);

    return callback(null, `Error: ${error}`);
  }
};