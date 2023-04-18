import express from "express";
import fetch from "node-fetch";
import * as dotenv from "dotenv";
dotenv.config();
const app = express();

app.get("/update", (request, responseServer) => {
  fetch(
    "https://api.hubapi.com/crm/v3/objects/deals?properties=deal_currency_code%2Camount",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
      },
    }
  )
    .then((res) => res.json())
    .then((json) => {
      let newObj = json.results;
      console.log(newObj);

      newObj.forEach((element) => {
        if (element.properties.deal_currency_code === "USD") return;

        fetch(
          `https://api.apilayer.com/fixer/latest?symbols=usd&base=${element.properties.deal_currency_code}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.CURRENCYKEY,
            },
          }
        )
          .then((res) => res.json())
          .then((json) => {
            let currencyConversion =
              +element.properties.amount * +json.rates.USD;

            ////////////////////////////making patch request to change data of hubspot deals//////////
            fetch(`https://api.hubapi.com/crm/v3/objects/deals/${element.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: process.env.AUTHORIZATION,
                apikey: process.env.APIUPDATEKEY,
              },
              body: `{"id":"${element.id}","properties":{"amount":"${Math.trunc(
                currencyConversion
              )}","deal_currency_code":"USD"}}`,
            })
              .then((res) => res.json())
              .then((json) => console.log(json))
              .catch((err) => console.error("error:" + err));
          })
          .catch((err) => console.error("error:" + err));
      });
    })
    .then(() => {
      responseServer.send("hogya bhai");
    })
    .catch((err) => console.error("error:" + err));
});

app.listen(4000, () => {
  console.log("listening on port : 4000");
});