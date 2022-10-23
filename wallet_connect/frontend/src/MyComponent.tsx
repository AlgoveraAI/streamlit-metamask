import {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"
import * as ethers from "ethers"
const LitJsSdk = require("lit-js-sdk");

interface State {
  walletAddress: string
  transaction: string
  isFocused: boolean
  encryptedString: string
  encryptedSymmetricKey: string
  decryptedString: string
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

// Helper function
export async function checkAndSignEVMAuthMessage({
  chain,
  resources,
  switchChain,
}) {
  const selectedChain = LIT_CHAINS[chain];
  const { web3, account } = await connectWeb3({
    chainId: selectedChain.chainId,
  });
  log(`got web3 and account: ${account}`);

  let chainId;
  try {
    const resp = await web3.getNetwork();
    chainId = resp.chainId;
  } catch (e) {
    // couldn't get chainId.  throw the incorrect network error
    log("getNetwork threw an exception", e);
    throwError({
      message: `Incorrect network selected.  Please switch to the ${chain} network in your wallet and try again.`,
      name: "WrongNetworkException",
      errorCode: "wrong_network",
    });
  }
  let selectedChainId = "0x" + selectedChain.chainId.toString("16");
  log("chainId from web3", chainId);
  log(
    `checkAndSignAuthMessage with chainId ${chainId} and chain set to ${chain} and selectedChain is `,
    selectedChain
  );
  if (chainId !== selectedChain.chainId && switchChain) {
    if (web3.provider instanceof WalletConnectProvider) {
      // this chain switching won't work.  alert the user that they need to switch chains manually
      throwError({
        message: `Incorrect network selected.  Please switch to the ${chain} network in your wallet and try again.`,
        name: "WrongNetworkException",
        errorCode: "wrong_network",
      });
      return;
    }
    try {
      log("trying to switch to chainId", selectedChainId);
      await web3.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: selectedChainId }],
      });
    } catch (switchError) {
      log("error switching to chainId", switchError);
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          const data = [
            {
              chainId: selectedChainId,
              chainName: selectedChain.name,
              nativeCurrency: {
                name: selectedChain.name,
                symbol: selectedChain.symbol,
                decimals: selectedChain.decimals,
              },
              rpcUrls: selectedChain.rpcUrls,
              blockExplorerUrls: selectedChain.blockExplorerUrls,
            },
          ];
          await web3.provider.request({
            method: "wallet_addEthereumChain",
            params: data,
          });
        } catch (addError) {
          // handle "add" error
          if (addError.code === -32601) {
            // metamask code indicating "no such method"
            throwError({
              message: `Incorrect network selected.  Please switch to the ${chain} network in your wallet and try again.`,
              name: "WrongNetworkException",
              errorCode: "wrong_network",
            });
          } else {
            throw addError;
          }
        }
      } else {
        if (switchError.code === -32601) {
          // metamask code indicating "no such method"
          throwError({
            message: `Incorrect network selected.  Please switch to the ${chain} network in your wallet and try again.`,
            name: "WrongNetworkException",
            errorCode: "wrong_network",
          });
        } else {
          throw switchError;
        }
      }
    }
    // we may have switched the chain to the selected chain.  set the chainId accordingly
    chainId = selectedChain.chainId;
  }
  log("checking if sig is in local storage");
  let authSig = localStorage.getItem("lit-auth-signature");
  if (!authSig) {
    log("signing auth message because sig is not in local storage");
    await signAndSaveAuthMessage({
      web3,
      account,
      chainId,
      resources,
    });
    authSig = localStorage.getItem("lit-auth-signature");
  }
  authSig = JSON.parse(authSig);
  // make sure we are on the right account
  if (account !== authSig.address) {
    log(
      "signing auth message because account is not the same as the address in the auth sig"
    );
    await signAndSaveAuthMessage({
      web3,
      account,
      chainId: selectedChain.chainId,
      resources,
    });
    authSig = localStorage.getItem("lit-auth-signature");
    authSig = JSON.parse(authSig);
  } else {
    // check the resources of the sig and re-sign if they don't match
    let mustResign = false;
    try {
      const parsedSiwe = new SiweMessage(authSig.signedMessage);
      log("parsedSiwe.resources", parsedSiwe.resources);

      if (JSON.stringify(parsedSiwe.resources) !== JSON.stringify(resources)) {
        log(
          "signing auth message because resources differ from the resources in the auth sig"
        );
        mustResign = true;
      } else if (parsedSiwe.address !== getAddress(parsedSiwe.address)) {
        log(
          "signing auth message because parsedSig.address is not equal to the same address but checksummed.  This usually means the user had a non-checksummed address saved and so they need to re-sign."
        );
        mustResign = true;
      }
    } catch (e) {
      log("error parsing siwe sig.  making the user sign again: ", e);
      mustResign = true;
    }
    if (mustResign) {
      await signAndSaveAuthMessage({
        web3,
        account,
        chainId: selectedChain.chainId,
        resources,
      });
      authSig = localStorage.getItem("lit-auth-signature");
      authSig = JSON.parse(authSig);
    }
  }
  log("got auth sig", authSig);
  return authSig;
}



// End Helper function






// Set up the middleware stack
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
  console.log("getting authSig");
  // const authSig = await getAuthSig();
  console.log("got authSig ", authSig);
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


async function decrypt(encryptedString: string, encryptedSymmetricKey: string) {
  const litNodeClient = await getClient();

  const authSig = await getAuthSig();

  const chain = "polygon";
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
  const accessControlConditions = window.accessControlConditions;

  const symmetricKey = await litNodeClient.getEncryptionKey({
    accessControlConditions,
    toDecrypt: encryptedSymmetricKey,
    chain,
    authSig
  })

  const decryptedString = await LitJsSdk.decryptString(
    encryptedString,
    symmetricKey
  );

  return { decryptedString }
}
// End Lit Protocol Integration



/**
 * This is a React-based component template. The `render()` function is called
 * automatically when your component should be re-rendered.
 */
class WalletConnect extends StreamlitComponentBase<State> {
  public state = { walletAddress: "not", transaction: "", isFocused: false, encryptedString: "", encryptedSymmetricKey: "", decryptedString: "" };

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
    } else if (this.props.args["key"] === "encrypt") {
      const { encryptedString, encryptedSymmetricKey } = await encrypt()
      this.setState(
        () => ({ encryptedString: encryptedString, encryptedSymmetricKey: encryptedSymmetricKey }),
        () => Streamlit.setComponentValue({ encryptedString, encryptedSymmetricKey })
      )
    } else if (this.props.args["key"] === "decrypt") {
      const { decryptedString } = await decrypt(this.state.encryptedString, this.state.encryptedSymmetricKey)
      this.setState(
        () => ({ decryptedString: decryptedString }),
        () => Streamlit.setComponentValue(decryptedString)
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
