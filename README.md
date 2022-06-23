# sfdc-flex

This is a Twilio serverless project.

## Setup
- Clone the repo
- do ```npm install```
- Copy the .env copy to .env and fill in all the variables.
- Push the code to Functions twilio serverless:deploy --profile=XXXXX
- Copy the sfdcFlex.private.json content into a Studio Flow and save
- Associate a mobile number with the Studio flow

## SFDC setup
It is assumed you have SFDC set up to work with Flex already and that there is a customer record corresponding to your CLI. The CLI is used to trigger the record fetch.


## Use
- Call the number
- Give short summary of what you are asking
- Result get written into SFDC comments
- Flex inside SFDC will have a call
