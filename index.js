require("dotenv").config();
const cors = require('cors')
const express = require('express');
const app = express();
app.use(cors());//use cors
const mongoose = require('mongoose');
const { getRatingInfo } = require('./scraper.js');


//connect to mongo
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


//define mongo schemas
var reportSchema = new mongoose.Schema({
  company_name: {
    type: String,
    required: true
  },
  search_url: {
    type: String,
    required: false
  },
  glassdoor_rating: {
    type: String,
    required: false
  },
  glassdoor_votes: {
    type: String,
    required: false
  },
  glassdoor_link: {
    type: String,
    required: false
  }
}, { timestamps: true });

var Report = mongoose.model("Report", reportSchema);



//serve index page
app.get("/", function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

//serve api requests
app.get('/api/:company', async function(req, res) {

  //validate input
  const input = req.params.company;
  const isValidCompanyName = input && input.match(/^[a-zA-Z0-9\-]+$/);
  if (!isValidCompanyName) {
    res.json(500, {
      error: "Invalid company name"
    });
    return;
  }

  //check if company is already on mongo
  const result = await Report.findOne({ company_name: input });
  if (result) {
    console.log("found in mongo");
    const { company_name, search_url, glassdoor_rating, glassdoor_votes, glassdoor_link } = result;
    res.json({ company_name, search_url, glassdoor_rating, glassdoor_votes, glassdoor_link });
  } else {//not on mongo

    //get rating info (mock)
    const ratingInfo = await getRatingInfoMock(input);
    if (ratingInfo.error !== undefined) {
      res.json(500, {
        error: ratingInfo.error
      });
      return;
    }

    //save to mongo
    const document = new Report(ratingInfo);
    document.save();
    console.log("saved to mongo");
    res.json(ratingInfo)

  }
});

// listen for requests
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});


//mock function
function getRatingInfoMock(input) {
  return {
    company_name: input,
    search_url: "https://www.glassdoor.com/Reviews/Mapfre-Barcelona-Reviews-EI_IE92366.0,13_IC92366.htm",
    glassdoor_rating: "4.5",
    glassdoor_votes: "1,000",
    glassdoor_link: "https://www.glassdoor.com/Reviews/Mapfre-Barcelona-Reviews-EI_IE92366.0,13_IC92366.htm"
  }
}