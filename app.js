const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const https = require("https");
require("dotenv").config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/", (req, res) => {
  // parsing user input into the server
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;

  // formating user data according to mailchimp api references
  const data = {
    members: [
      {
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
        },
      },
    ],
  };

  const jsonData = JSON.stringify(data);

  // API credentials redacted using environment variables
  const list_id = process.env.LIST_ID;
  const url = `https://us12.api.mailchimp.com/3.0/lists/${list_id}`;
  const apiKey = process.env.APIKEY;
  const options = {
    method: "POST",
    auth: `olanrewajudev:${apiKey}`,
  };

  // making request to mailchimp api
  const requestToMailChimp = https.request(url, options, (response) => {
    if (response.statusCode === 200) {
      res.sendFile(__dirname + "/success.html");
    } else {
      res.sendFile(__dirname + "/failure.html");
    }

    response.on("data", (data) => {
      console.log(data);
    });
  });

  // writing into mailchimp server
  requestToMailChimp.write(jsonData);
  requestToMailChimp.end();
  // console.log("Data successfully sent to mailchimp list");
});

// handling error by returning user to homepage
app.post("/failure", (req, res) => {
  res.redirect("/");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port 3000");
});
