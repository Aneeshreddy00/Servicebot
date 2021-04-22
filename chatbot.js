const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } =require("dialogflow-fulfillment");
const app = express();

const MongoClient = require('mongodb').MongoClient;
console.log("connected");
var url = "mongodb://localhost:27017/";
var randomstring = require("randomstring"); 
var user_name="";

app.post("/dialogflow", express.json(), (req, res) => {
    const agent = new WebhookClient({ 
		request: req, response: res 
		});


async function identify_user(agent)
{
  const acct_num = agent.parameters.acct_num;
  console.log(acct_num);
  const client = new MongoClient(url);
  await client.connect();
  const snap = await client.db("Ticket").collection("user").findOne({acct_num: acct_num});
  
  if(snap==null){
	  await agent.add("Invalid Input, Please check your input and try again");

  }
  else
  {
  user_name=snap.username;
  await agent.add("Welcome  "+user_name+"!!  \n How can I help you");}
}
	
function report_issue(agent)
{
 
  var issue_vals={1:"Internet Down",2:"Slow Internet",3:"Paying Bill",4:"Termination"};
  
  const intent_val=agent.parameters.issue_num;
  
  var val=issue_vals[intent_val];
  
  var trouble_ticket=randomstring.generate(7);

  //Generating trouble ticket and storing it in Mongodb
  //Using random module
  MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("Ticket");
    
	var u_name = user_name;    
    var issue_val=  val; 
    var status="pending";

	let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();

    var time_date=year + "-" + month + "-" + date;

	var myobj = { username:u_name, issue:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket };

    dbo.collection("user_issues").insertOne(myobj, function(err, res) {
    if (err) throw err;
    db.close();    
  });
 });
 agent.add("The issue reported is: "+ val +"\nThe ticket number is: "+trouble_ticket);
}

//trying to load rich response
function custom_payload(agent)
{
	var payLoadData=
		{
  "richContent": [
    [
      {
        "type": "list",
        "title": "Internet Down",
        "subtitle": "Press '1' for Internet Not Working",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Slow Internet",
        "subtitle": "Press '2' for Internet speed is slow",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
	  {
        "type": "divider"
      },
	  {
        "type": "list",
        "title": "Paying Bill",
        "subtitle": "Press '3' for Paying your Bill",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Termination",
        "subtitle": "Press '4' to Terminate your Connection",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      }
    ]
  ]
}
agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true, rawPayload:true }));
}




var intentMap = new Map();
intentMap.set("service_intent", identify_user);
intentMap.set("service_intent - custom - custom", report_issue);
intentMap.set("service_intent - custom", custom_payload);

agent.handleRequest(intentMap);

});//Closing tag of app.post

app.listen(process.env.PORT || 8080);

