import {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"
import * as ethers from "ethers"
import { encrypt, decrypt, login, mintAndLogin } from "./litComponent"
import { readFileSync, writeFileSync, promises as fsPromises } from 'fs';
import { join } from 'path';

interface State {
  walletAddress: string
  transaction: string
  isFocused: boolean
  encryptedString: string
  encryptedSymmetricKey: string
  decryptedString: string
  loggedIn: boolean
}

declare global {
  interface Window {
    ethereum: any,
    authSig: any,
    resourceId: any,
    accessControlConditions: any,
    litNodeClient: any,
    encryptedString: any,
    jwt: any,
    location: Location,
    chain: any,
    tokenId: any,
    tokenAddress: any,
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

// function syncWriteFile(filename: string, data: any) {
//   /**
//    * flags:
//    *  - w = Open file for reading and writing. File is created if not exists
//    *  - a+ = Open file for reading and appending. The file is created if not exists
//    */
//   writeFileSync(join(__dirname, filename), data, {
//     flag: 'w',
//   });

//   const contents = readFileSync(join(__dirname, filename), 'utf-8');
//   console.log(contents); // 👉️ "One Two Three Four"

//   return contents;
// }



/**
 * This is a React-based component template. The `render()` function is called
 * automatically when your component should be re-rendered.
 */
class WalletConnect extends StreamlitComponentBase<State> {
  public state = { 
    walletAddress: "not", 
    transaction: "", 
    isFocused: false, 
    encryptedString: "", 
    encryptedSymmetricKey: "", 
    decryptedString: "", 
    loggedIn: false, 
  };

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
      const backgroundColorStyling = `${this.state.isFocused ? "#4F8BF9" :  "#FF4B4B"}` // 
      style.border = borderStyling
      style.outline = borderStyling
      style.backgroundColor = backgroundColorStyling // "#FF4B4B"
      style.color = "white"
      style.borderRadius = "0.2rem"
      style.height = "2em"
      // style.width = "3em"
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
          onMouseOver={this._onFocus}
          onMouseOut={this._onBlur}
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
    } else if (this.props.args["key"] === "encrypt") {
        const { encryptedRealString, encryptedSymmetricKey } = await encrypt(this.props.args["message_to_encrypt"])
        // syncWriteFile('./example.txt', encryptedRealString);
        // const sth = await getAuthSig()
        // console.log("Connected Web3", sth)
        console.log("encryptedString", encryptedRealString)
        console.log("encryptedSymmetricKey", encryptedSymmetricKey)
        const decryptedString = await decrypt(encryptedRealString, encryptedSymmetricKey)
        // console.log("decryptedString", decryptedString)
        this.setState(
          () => ({ encryptedString: encryptedRealString, encryptedSymmetricKey: encryptedSymmetricKey }),
          () => Streamlit.setComponentValue({ encryptedRealString, encryptedSymmetricKey })
        )
    } else if (this.props.args["key"] === "decrypt") {
        const { decryptedString } = await decrypt(this.props.args["encrypted_string"], this.props.args["encrypted_symmetric_key"])
        this.setState(
          () => ({ decryptedString: decryptedString }),
          () => Streamlit.setComponentValue(decryptedString)
        )
        console.log("State of encrypted string3:", this.state.encryptedString)
    } else if (this.props.args["key"] === "login") {
        const lgn = await login(this.props.args["auth_nft_contract_address"])
        this.setState(
          () => ({ loggedIn: lgn }),
          () => Streamlit.setComponentValue(lgn)
        )
    } else if (this.props.args["key"] === "mint_and_login") {
      const lgn = await mintAndLogin()
      this.setState(
        () => ({ loggedIn: lgn }),
        () => Streamlit.setComponentValue(lgn)
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
