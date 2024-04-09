//scraping libraries
const cheerio = require("cheerio");
const unirest = require("unirest");


const getRatingInfo = async (company) => {
  try {
    //search
    companySearchString = company.replace(/-/g, '+').toLowerCase();
    const url = `https://www.google.com/search?q=site%3Aglassdoor.com+${companySearchString}+reviews+in+barcelona`;
    let user_agent = selectRandom();
    let header = {
      "User-Agent": `${user_agent}`
    }
    const response = await unirest.get(url).headers(header);

    if (response.body.includes("This page appears when Google automatically detects requests coming from your computer network which appear to be in violation of the")) {
      return { error: "scraping limit reached" };
    }

    const $ = cheerio.load(response.body);

    //get content
    const selectors = {
      rating: ".fG8Fp.uo4vr span:nth-child(2)",
      votes: ".fG8Fp.uo4vr span:nth-child(3)",
      link: "#rso > div:nth-child(1) > div > div > div > div.kb0PBd.cvP2Ce.A9Y9g.jGGQ5e > div > div > span > a"
    }
    const content = {
      company_name: company,
      search_url: url,
      glassdoor_rating: $(selectors.rating).eq(0).text().replace("Rating: ", ""),
      glassdoor_votes: $(selectors.votes).eq(0).text().replace(" votes", "").replace(" vote", ""),
      glassdoor_link: $(selectors.link).attr("href") || ""
    }
    console.log(content)
    if (content.glassdoor_rating == "") {
      return { error: "mysterius error, couldn't get a rating" }
    } else {
      return content;
    }
  } catch (e) {
    console.log(e);
  }
}

//random user selection
//copied from 
//https://hackernoon.com/scraping-google-search-results-with-node-js#:~:text=in%20a%20bit.-,As,-we%20know%2C%20Google
const selectRandom = () => {
  const userAgents = ["Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",]
  var randomNumber = Math.floor(Math.random() * userAgents.length);
  return userAgents[randomNumber];
}


//export function to use in index
module.exports = { getRatingInfo };