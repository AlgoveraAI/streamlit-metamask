import {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"
import * as ethers from "ethers"

interface State {
  walletAddress: string
  transaction: string
  isFocused: boolean
}

declare global {
  interface Window {
    ethereum: any,
    authSig: any,
    resourceId: any,
    accessControlConditions: any,
    litNodeClient: any,
    jwt: any,
    location: Location,
  }
}
interface Document {
  authStatus: any,
}


async function getAccount() {
  var provider
  var signer
  provider = new ethers.providers.Web3Provider(window.ethereum, "any")
  // Prompt user for account connections
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });
  await provider.send("eth_requestAccounts", [])
  window.ethereum.on('accountsChanged', function (accounts: any) {
    // Time to reload your interface with accounts[0]!
  });  
  signer = provider.getSigner()
  signer = "0"
  signer = provider.getSigner()
  const address = await signer.getAddress()
  return address
}

async function sendToken(to_address: string,
                        send_token_amount: string,
                        contract_address: string = "0x8967BCF84170c91B0d24D4302C2376283b0B3a07") {
  console.log("Sending OCEAN initiated");

  const contractAddress = contract_address;
  const contractAbiFragment = [
    {
      name: "transfer",
      type: "function",
      inputs: [
        {
          name: "_to",
          type: "address",
        },
        {
          type: "uint256",
          name: "_tokens",
        },
      ],
      constant: false,
      outputs: [
        {
          name: "",
          type: "bool",
        },
      ],
      payable: false,
    },
  ];
  console.log("Parameters defined");
  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  // Prompt user for account connections
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();

  let contract = new ethers.Contract(contractAddress, contractAbiFragment, signer);
  console.log("Contract defined");
  // How many tokens?
  let numberOfTokens = ethers.utils.parseUnits(send_token_amount, 18);
  console.log(`numberOfTokens: ${numberOfTokens}`);
  console.log("Ready to transfer");
  // Send tokens
  contract.transfer(to_address, numberOfTokens).then((transferResult: any) => {
    console.dir(transferResult);
    console.log("sent token");
  });
  console.log("Done: see address below on etherscan");
  console.log(to_address);
}

// Lit Protocol Integration
const LitJsSdk = require("lit-js-sdk");
const express = require("express");
const port = process.env.PORT || 8000;
const path = require("path");
var cookieParser = require("cookie-parser");

// This displays message that the server running and listening to specified port
const app = express();
app.listen(port, () => console.log(`Listening on port ${port}`)); //Line 6

async function checkUser(req: any, res: any, next: any) {

  const jwt = req.query?.jwt || req.cookies?.jwt;
  console.log("jwt is ", jwt);
  if (!jwt) {
    res.status(401).send("Unauthorized, return to login page.");
    return;
  }

  const { verified, header, payload } = LitJsSdk.verifyJwt({ jwt });

  if (
    !verified ||
    //payload.baseUrl !== "lit-estuary-storage.herokuapp.com/" || // Uncomment this and add your own URL that you are protecting
    //payload.path !== "/" || // Uncomment this and add your own URL Path that you are protecting
    payload.orgId !== "" ||
    payload.role !== "" ||
    payload.extraData !== ""
  ) {
    // Reject this request!
    res.status(401).send("Sorry, looks like you are not a holder of an Algovera Reputation NFT.");
    return;
  }

  res.cookie("jwt", jwt, {
    secure: process.env.NODE_ENV !== "development",
    httpOnly: false,
    sameSite: "lax",
  });

  if (req.query?.jwt) {
    const newUrl = req.originalUrl.replace(/\?jwt=.*/, "");
    console.log("redirecting to ", newUrl);
    // redirect to strip the jwt so the user can't just copy / paste this url to share this website
    await res.redirect(newUrl);
  }

  next();
}

// Set up the middleware stack
app.use(cookieParser());
app.use(checkUser);


async function getAuthSig() {
  const authSig = await LitJsSdk.checkAndSignAuthMessage({chain: 'polygon'});
  window.authSig = authSig;
  return authSig
}

async function getClient() {
  const litNodeClient = new LitJsSdk.LitNodeClient();
  await litNodeClient.connect();
  window.litNodeClient = litNodeClient;

  return litNodeClient
}


async function encrypt() {
  const litNodeClient = await getClient();

  window.accessControlConditions = [
    {
      contractAddress: '0x68085453B798adf9C09AD8861e0F0da96B908d81',
      standardContractType: "ERC1155",
      chain: "polygon",
      method: "balanceOf",
      parameters: [":userAddress", '0', '1', '2', '3', '4', '5' ],
      returnValueTest: {
        comparator: ">",
        value: "0",
      },
    },
  ];

  const authSig = await getAuthSig();
  const accessControlConditions = window.accessControlConditions;
  const chain = "polygon";

  // encrypting content -> this we can change to our own content
  const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
    "this is a secret message"
  );
  // saving encrypted content to Lit Node
  const encryptedSymmetricKey = await window.litNodeClient.saveEncryptionKey({
    accessControlConditions,
    symmetricKey,
    authSig,
    chain,
  });

  return {
    encryptedString,
    encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
  }
}

async function provisionAccess() {
  const litNodeClient = await getClient();

  window.accessControlConditions = [
    {
      contractAddress: '0x68085453B798adf9C09AD8861e0F0da96B908d81',
      standardContractType: "ERC1155",
      chain: "polygon",
      method: "balanceOf",
      parameters: [":userAddress", '0', '1', '2', '3', '4', '5' ],
      returnValueTest: {
        comparator: ">",
        value: "0",
      },
    },
  ];

  const authSig = await getAuthSig();
  const accessControlConditions = window.accessControlConditions;
  const chain = "polygon";

  // encrypting content -> this we can change to our own content
  const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
    "this is a secret message"
  );
  // saving encrypted content to Lit Node
  const encryptedSymmetricKey = await window.litNodeClient.saveEncryptionKey({
    accessControlConditions,
    symmetricKey,
    authSig,
    chain,
  });


  // generate a random path because you can only provision access to a given path once
  const randomUrlPath =
    "/" +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  window.resourceId = {
    baseUrl: "lit-estuary-storage.herokuapp.com/",
    path: randomUrlPath, // this would normally be our url path, like "/algovera.storage" for example
    orgId: "",
    role: "",
    extraData: "",
  };
  await litNodeClient.saveSigningCondition({
    accessControlConditions: window.accessControlConditions,
    chain: 'polygon',
    authSig: window.authSig,
    resourceId: window.resourceId,
  });
}

async function requestJwt() {
  const litNodeClient = await getClient();

  window.jwt = await litNodeClient.getSignedToken({
    accessControlConditions: window.accessControlConditions,
    chain: 'polygon',
    authSig: window.authSig,
    resourceId: window.resourceId,
  });

}
async function verifyJwt() {
  if (document != null) {
    document.getElementById('verificationStatus').innerText = "Verifying, please wait..."
    const data = await fetch('/verify?jwt=' + window.jwt).then(resp => resp.json())
    document.getElementById('verificationStatus').innerText = "Verified!  Response is \n" + JSON.stringify(data, null, 2)
    document.getElementById('verificationNote').style = 'display: block;'
  }
}
// End Lit Protocol Integration



/**
 * This is a React-based component template. The `render()` function is called
 * automatically when your component should be re-rendered.
 */
class WalletConnect extends StreamlitComponentBase<State> {
  public state = { walletAddress: "not", transaction: "", isFocused: false }

  public render = (): ReactNode => {
    // Arguments that are passed to the plugin in Python are accessible
    // via `this.props.args`. Here, we access the "name" arg.

    // Streamlit sends us a theme object via props that we can use to ensure
    // that our component has visuals that match the active theme in a
    // streamlit app.
    const { theme } = this.props
    const style: React.CSSProperties = {}

    // Maintain compatibility with older versions of Streamlit that don't send
    // a theme object.
    if (theme) {
      // Use the theme object to style our button border. Alternatively, the
      // theme style is defined in CSS vars.
      const borderStyling = `0px solid ${
        this.state.isFocused ? theme.primaryColor : "gray"
      }`
      style.border = borderStyling
      style.outline = borderStyling
      style.backgroundColor = "#FF4B4B"
      style.color = "white"
      style.borderRadius = "0.2rem"
    }

    const message = this.props.args["message"]
    // Show a button and some text.
    // When the button is clicked, we'll increment our "numClicks" state
    // variable, and send its new value back to Streamlit, where it'll
    // be available to the Python program.
    return (
      <span>
        <button
          style={style}
          onClick={this.onClicked}
          disabled={this.props.disabled}
          onFocus={this._onFocus}
          onBlur={this._onBlur}
        >
          {message}
        </button>
      </span>
    )
  }

  /** Click handler for our "Click Me!" button. */
  private onClicked = async (): Promise<void> => {
    if (this.props.args["key"] === "wallet") {
    const address = await getAccount()
    this.setState(
      () => ({ walletAddress: address }),
      () => Streamlit.setComponentValue(this.state.walletAddress)
    )
    } else if (this.props.args["key"] === "send") {
      const tx: any = await sendToken(this.props.args["to_address"], this.props.args["amount"], this.props.args["contract_address"])
      // const tx: any = await send_token(this.props.args["contract_address"], this.props.args["amount"], this.props.args["to_address"])
      // const tx = await sendFixedPayment(String(this.props.args["amount"]), this.props.args["to"])
      this.setState(
        () => ({ transaction: tx }),
        () => Streamlit.setComponentValue(this.state.transaction)
      )
    }
    // Increment state.numClicks, and pass the new value back to
    // Streamlit via `Streamlit.setComponentValue`.
  }

  /** Focus handler for our "Click Me!" button. */
  private _onFocus = (): void => {
    this.setState({ isFocused: true })
  }

  /** Blur handler for our "Click Me!" button. */
  private _onBlur = (): void => {
    this.setState({ isFocused: false })
  }
}

// "withStreamlitConnection" is a wrapper function. It bootstraps the
// connection between your component and the Streamlit app, and handles
// passing arguments from Python -> Component.
//
// You don't need to edit withStreamlitConnection (but you're welcome to!).
export default withStreamlitConnection(WalletConnect)
