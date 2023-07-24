const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mailchimp = require("@mailchimp/mailchimp_marketing");
const md5 = require("md5");
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
  const subscriberEmail = req.body.email;

  // MailChimp Audience ID and API redacted with environment variables
  const listId = process.env.LIST_ID;

  mailchimp.setConfig({
    apiKey: process.env.APIKEY,
    server: "us12",
  });

  const subscribingUser = {
    firstname: firstName,
    lastname: lastName,
    email: subscriberEmail,
  };

  const subscriberHash = md5(subscribingUser.email.toLowerCase());

  // function to resubscribing a user
  async function resubscribeUser() {
    let response = await mailchimp.lists.setListMember(listId, subscriberHash, {
      email_address: subscribingUser.email,
      status: "pending",
      merge_fields: {
        FNAME: subscribingUser.firstname,
        LNAME: subscribingUser.lastname,
      },
    });

    // Sending response back to user
    res.sendFile(__dirname + "/success.html");
    console.log("i got here", response.status);
  }

  // function to resubscribing a user
  async function updateExistingUserInfo() {
    let response = await mailchimp.lists.updateListMember(
      listId,
      subscriberHash,
      {
        merge_fields: {
          FNAME: subscribingUser.firstname,
          LNAME: subscribingUser.lastname,
        },
      }
    );
    // Logging user subscription status
    console.log(`This user's subscription status is ${response.status}.`);
    res.sendFile(__dirname + "/alreadysubscribed.html");
  }

  async function subscribeUser() {
    try {
      // Checking user subscription status
      let response = await mailchimp.lists.getListMember(
        listId,
        subscriberHash
      );

      console.log(response.status);

      if (
        response.status === "unsubscribed" ||
        "archived" ||
        "non-subscribed" ||
        "cleaned"
      ) {
        console.log("i got here!!!");
        return resubscribeUser();
      } else if (response.status === "subscribed") {
        return updateExistingUserInfo();
      }
    } catch (e) {
      // Adding new subscriber to the audience list
      if (e.status === 404) {
        console.log(`This email is not subscribed to this list`, e);

        let response = await mailchimp.lists.addListMember(listId, {
          email_address: subscribingUser.email,
          status: "subscribed",
          merge_fields: {
            FNAME: subscribingUser.firstname,
            LNAME: subscribingUser.lastname,
          },
        });

        res.sendFile(__dirname + "/success.html");
        console.log(response.status);
      } else {
        res.sendFile(__dirname + "/failure.html");
      }
    }
  }

  subscribeUser();
});

// handling error by returning user to homepage
app.post("/failure", (req, res) => {
  res.redirect("/");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port 3000");
});
