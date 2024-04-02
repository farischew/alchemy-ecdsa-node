const { secp256k1 } = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes } = require("ethereum-cryptography/utils");

const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "0x8e471191c406b425e65521352c81e63e439c7fa3": 100,
  "0xa0bb858a2d08169c9105dd95d8ab90de6ae9cc0f": 50,
  "0xc31c2dc8c8f447879564e294ac7fae6c0f2ad198": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, privateKey } = req.body;

  const message = {
    sender,
    amount,
    recipient,
  };
  const messageHash = keccak256(utf8ToBytes(JSON.stringify(message)));

  const signature = secp256k1.sign(messageHash, privateKey);

  const publicKey = secp256k1.getPublicKey(privateKey, false);
  const isSigned = secp256k1.verify(signature, messageHash, publicKey);

  if (!isSigned) {
    res.status(400).send({ message: "Signature not Verified" });
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
