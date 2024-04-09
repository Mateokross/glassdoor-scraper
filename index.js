const cors = require('cors')
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const { getRatingInfo } = require('./scraper.js');

// Parse JSON bodies
app.use(bodyParser.json());

// Enable CORS
app.use(cors());

// Load environment variables
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

// Define MongoDB schema
var reportSchema = new mongoose.Schema({
  company_name: {
    type: String,
    required: true
  },
  review_location: {
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

//status
app.get('/api/status', (req, res) => {
  res.send('OK!')
})


//serve api requests
app.post('/api/report', async function(req, res) {

  //validate input
  const { company, location } = req.body;
  console.log("Company: " + company +  ", Location: " + location);
  const isValidInput = company && location && company.match(/^[a-zA-Z0-9\-]+$/);
  if (!isValidInput) {
    res.status(400).json({ error: "Invalid input data" });
    return;
  }

  //check if company is already on mongo
  const result = await Report.findOne({ company_name: company , review_location: location });
  if (result) {
    console.log("Found in MongoDB...");
    const { company_name, review_location, search_url, glassdoor_rating, glassdoor_votes, glassdoor_link } = result;
    res.json({ company_name, review_location, search_url, glassdoor_rating, glassdoor_votes, glassdoor_link });

  } else {//not on mongo

    //get rating info (mock)
    const ratingInfo = await getRatingInfo(company, location);
    if (ratingInfo.error !== undefined) {
      if(ratingInfo.error == "scraping limit reached"){
        res.status(420).json({ error: ratingInfo.error });
        return;
      }else{
        res.status(500).json({ error: ratingInfo.error });
        return;
      }
    }

    //save to mongo
    const document = new Report(ratingInfo);
    document.save();
    console.log("Saved results to MongoDB...");
    res.json(ratingInfo)

  }
});

// listen for requests
const listener = app.listen(process.env.PORT || 3000,"0.0.0.0", function() {
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