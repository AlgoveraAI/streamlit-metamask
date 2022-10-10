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
    ethereum: any
  }
}

async function getAccount() {
  var provider
  var signer
  provider = new ethers.providers.Web3Provider(window.ethereum, "any")
  // Prompt user for account connections
  await provider.send("eth_requestAccounts", [])
  signer = provider.getSigner()
  const address = await signer.getAddress()
  return address
}

async function sendFixedPayment(tokenAmount: string, toAddress: string) {
  console.log("Sending fixed payment")
  var ethersProvider = new ethers.providers.Web3Provider(window.ethereum, "any")
  var signer = ethersProvider.getSigner()
  const address = await signer.getAddress()
  const gas_price = ethersProvider.getGasPrice()
  const tx = {
    from: address,
    to: toAddress,
    value: ethers.utils.parseEther(tokenAmount), // send_token_amount
    nonce: ethersProvider.getTransactionCount(address, "latest"),
    gasLimit: ethers.utils.hexlify(100000), // 100000 - gas_limit
    gasPrice: gas_price,
  }
  console.log("Got here")
  signer.sendTransaction(tx).then((transaction) => {
    console.dir(transaction)
    alert("Send finished!")
  })

  return "Sent Transaction"
}

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
      console.log(this.props.args["amount"])
      console.log(this.props.args["to"])
      const tx = await sendFixedPayment(String(this.props.args["amount"]), this.props.args["to"])
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
