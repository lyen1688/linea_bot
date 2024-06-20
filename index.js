const express = require("express");
const bodyParser = require("body-parser");
const axios = require('axios');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/getWalletInfo", async (req, res) => {
  const requestId = req.headers["x-fc-request-id"];
  console.log("FC Invoke Start RequestId: " + requestId);

  const walletAddresses = req.body.wallet_addresses;

  if (!Array.isArray(walletAddresses) || walletAddresses.some(address => !address.startsWith("0x"))) {
    res.status(400).send({
      msg: "Invalid wallet_addresses",
    });
    return;
  }

  const results = await Promise.all(walletAddresses.map(async (address) => {
    const result = { wallet_address: address };

    try {
      const pointsResponse = await axios.get(`https://kx58j6x5me.execute-api.us-east-1.amazonaws.com/linea/getUserPointsSearch?user=${address}`);
      result.lxp_l = pointsResponse.data[0].xp;
      result.rank = pointsResponse.data[0].rank_xp;
    } catch (error) {
      result.lxp_l = 0;
      result.rank = 0;
    }

    try {
      const pohResponse = await axios.get(`https://linea-xp-poh-api.linea.build/poh/${address}`, { responseType: 'json' });
      result.poh = pohResponse.data.poh ? '正常' : '异常';
    } catch (error) {
      result.poh_error = error.message;
    }

    return result;
  }));

  res.send(results);

  console.log("FC Invoke End RequestId: " + requestId);
});

const port = 9000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
