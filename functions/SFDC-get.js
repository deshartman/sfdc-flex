// const got = require("got");
const axios = require('axios');

exports.handler = async function (context, event, callback) {
  let auth_url = "https://login.salesforce.com/services/oauth2/token";
  // let client_id = process.env.SFDC_CLIENT_ID;
  // let client_secret = process.env.SFDC_CLIENT_SECRET;
  // let username = process.env.SFDC_USERNAME;
  // let password = process.env.SFDC_PASSWORD;
  // let grant_type = "password";
  // console.log("event: " + JSON.stringify(event));

  // URL Encode the POST body data
  const urlEncodedAuth_params = new URLSearchParams();
  urlEncodedAuth_params.append('grant_type', "password");
  urlEncodedAuth_params.append('client_id', process.env.SFDC_CLIENT_ID);
  urlEncodedAuth_params.append('client_secret', process.env.SFDC_CLIENT_SECRET);
  urlEncodedAuth_params.append('username', process.env.SFDC_USERNAME);
  urlEncodedAuth_params.append('password', process.env.SFDC_PASSWORD);

  let query_url = "https://" + process.env.SFDC_INSTANCE_URL + "/services/data/v54.0/query/";

  let query =
    "SELECT Id,Contact.Account.Name,email,ReportsTo.Member_ID__c,line_user_id__c,MessengerID__c,ReportsTo.Name,FirstName,Member_ID__c,LastName,Phone,AssistantName,AssistantPhone,LoyaltyTier__c,LoyaltyPoints__c,CreatedDate,(select id, CaseNumber, subject, owner.alias from Cases where Status != 'Closed'),(select id, ActivityDate from Tasks where Status != 'Completed') FROM Contact WHERE ";

  let contact = event.contact
  contact = contact.substring(contact.indexOf(":") + 1);
  console.log(`Contact: ${contact}`)

  let query_lookup = "";
  if (event.id && !isNaN(event.id)) {
    query_lookup = "Member_ID__c = " + event.id;
  }

  if (event.contact.includes('line')) {
    query_lookup = "line_user_id__c = '" + contact + "'";
  }

  if (event.contact.includes('messenger')) {
    query_lookup = "MessengerID__c ='" + contact + "'";
  }
  else {
    query_lookup = "Phone = '" + contact + "'";
  }

  if (event.id && !isNaN(event.id)) {
    query_lookup = "Member_ID__c = " + event.id;
  }
  query = query + query_lookup;

  // console.log(`The query is: ${query}`);

  // URL Encode the POST body data
  const urlEncodedQuery = new URLSearchParams();
  urlEncodedQuery.append('q', query);

  // First step is to get the token
  try {
    console.log(`Getting token with Auth Params ${urlEncodedAuth_params}`);

    axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
    const response = await axios.post(auth_url, urlEncodedAuth_params);

    console.log(`Got token: ${response.data.access_token}`);

    // Set the token in the headers
    axios.defaults.headers.common = {
      'Authorization': 'Bearer ' + response.data.access_token,
    };
  } catch (error) {
    console.log(`Token Post Error: ${error}`);
    return callback(null, `SFDC get error: ${error}`)
  }

  // Now we can query the API using the token
  console.log(`URL: >>>> [${query_url}?${urlEncodedQuery}]`)


  try {
    // axios.defaults.headers.get['Content-Type'] = 'application/x-www-form-urlencoded';
    // console.log(`Querying SFDC with query: ${query_url}?${urlEncodedQuery}`);
    const response = await axios.get(`${query_url}?${urlEncodedQuery}`);

    console.log('Got a response');

    const SFDCRecord = response.data.records[0];

    if (response.data.records && response.data.records.length > 0) {
      console.log("returned a contact");
      console.log(response.data.records[0]);
      const ReportsTo = SFDCRecord.ReportsTo;
      let caseNumber = SFDCRecord.Cases.records[0].CaseNumber;
      console.log(caseNumber);
      let caseID;
      if (response.data.records[0].Cases.records && SFDCRecord.Cases.records[0].Id !== null) {
        console.log("returned a case");
        caseID = SFDCRecord.Cases.records[0].Id;
        console.log(caseID);
      }
      else {
        console.log("No case");
      }
      let contact = '';
      if (response.data.records[0].line_user_id__c !== '') {
        contact = SFDCRecord.line_user_id__c;
      }
      else {
        contact = SFDCRecord.MobilePhone;
      }

      const SFDCRecord_return = {
        contact_id: SFDCRecord.Id,
        reportsto_id: ReportsTo ? ReportsTo.Member_ID__c : "",
        reportsto_name: ReportsTo ? ReportsTo.Name : "",
        delegate: SFDCRecord.AssistantName,
        delegate_phone: SFDCRecord.AssistantPhone,
        first_name: SFDCRecord.FirstName,
        contact: contact,
        email: SFDCRecord.Email,
        member_id: SFDCRecord.Member_ID__c,
        last_name: SFDCRecord.LastName,
        account: SFDCRecord.Account
          ? SFDCRecord.Account.Name
          : "",
        phone: SFDCRecord.Phone,
        points: SFDCRecord.LoyaltyPoints__c
          ? SFDCRecord.LoyaltyPoints__c
          : 0,
        join_date: SFDCRecord.CreatedDate,
        bill_due: SFDCRecord.Tasks
          ? SFDCRecord.Tasks.records[0].ActivityDate
          : "",
        tier: SFDCRecord.LoyaltyTier__c
          ? SFDCRecord.LoyaltyTier__c
          : 0,
        cases: SFDCRecord.Cases,
        CaseNumber: caseNumber,
        caseID: caseID,
      }

      callback(null, SFDCRecord_return);
    } else {
      console.log("no contact found:" + JSON.stringify(response.data));
      callback(null, {
        points: 0
      });
    }

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