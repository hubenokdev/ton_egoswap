import { beginCell, Dictionary } from "ton-core";
import fs from "fs";
import { contractAddress, Cell, } from "ton-core";
//import { deployAmmMinter } from "../../tonswap-contracts/deploy/deploy-utils";
import { mnemonicToWalletKey } from "ton-crypto";
import { WalletContractV3R2, internal } from "ton";
import { TonClient, SendMode, Address,  } from "ton";
import { getHttpEndpoint } from "@orbs-network/ton-access"

function initData(addr:Address) {
  // Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
  return beginCell().storeUint(1, 64).storeAddress(addr).storeDict(Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Cell())).endCell();
  //return beginCell().storeUint(1, 64).storeAddress(addr).storeDict(Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Buffer(32))).endCell();
  //return beginCell().storeUint(1, 64).storeAddress(addr).storeDict(Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Buffer(32))).endCell();
  //return beginCell().storeUint(1, 64).storeAddress(addr).endCell();
}
//

// const initDataCell = initData(); // the function we've implemented just now
// const initCodeCell = Cell.fromBoc(fs.readFileSync("counter.cell"))[0]; // compilation output from step 6

// const newContractAddress = contractAddress(0, {code: initCodeCell, data: initDataCell});

let netmode = 'main';
const testnet_mnemonic = "wealth penalty dress update vacuum wise solution prize exit hero among catalog pioneer busy trial retreat east much loyal mango galaxy raven brother merge"; // your 24 secret words
const mainnet_mnemonic = "transfer milk cage october head wild brain voyage chief opinion coil high gap outside fury someone jaguar wagon hello route barrel net defy boy"; // your 24 secret words

deploy();

async function deploy() {
  //return;
  const key = await mnemonicToWalletKey(netmode == 'test' ? testnet_mnemonic.split(" ") : mainnet_mnemonic.split(" "));
  const wallet = WalletContractV3R2.create({
    publicKey: key.publicKey,
    workchain: 0,
  });
  const endpoint = await getHttpEndpoint({
    network: netmode == 'test' ? "testnet" : "mainnet" // or "testnet", according to your choice
  });
  const client = new TonClient({ endpoint });
  console.log("wallet start ====> " + wallet.address);

  let initDataCell = initData(wallet.address); // the function we've implemented just now
  const initCodeCell = Cell.fromBoc(fs.readFileSync("./contracts/counter.cell"))[0]; // compilation output from step 6

  let newContractAddress = contractAddress(0, {code: initCodeCell, data: initDataCell});
  console.log("contract start ====> " + (netmode == 'test' ? "testnet: " : "mainnet: ") + newContractAddress);
  fs.writeFileSync("contract_address.txt", newContractAddress.toString());

  const contract = client.open(wallet);

  console.log("contract opened ====> " + contract.address);

  const seqno = await contract.getSeqno(); // get the next seqno of our wallet
  
  console.log("getSeqno ====> " + seqno);

  const transfer = contract.createTransfer({
    seqno,
    messages: [
      internal({
        to: newContractAddress.toString(),
        value: '0.01',
        init: { data: initDataCell, code: initCodeCell },
        bounce: false,
      }),
    ],
    secretKey: key.secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
  });

  await client.sendExternalMessage(wallet, transfer);

  console.log("contract end ====> " );

}