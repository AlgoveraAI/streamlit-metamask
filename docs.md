# Streamlit Web3 Documentation

The Streamlit Web3 library is a Python library that allows you to easily integrate Web3 into your Streamlit app. To view the source code or contribute to the project, visit the [GitHub repository](https://github.com/AlgoveraAI/streamlit-metamask).

## Installation

```bash
pip install streamlit-wallet-connect
```

## Usage
Import the `streamlit_wallet_connect` module and use the `wallet_connect` function to connect to a wallet or send transactions.

```python
from wallet_connect import wallet_connect
```
The `wallet_connect` function will have different behavior depending on the `label` passed to it.

Available functionality:
| Label | Description |
| --- | --- |
| `wallet` | Connect to a wallet |
| `send` | Send a transaction |

### Connect to Wallet Button

```python
connect_button = wallet_connect(label="wallet", key="wallet")
```

### Send Transaction Button

To send a transaction, change the `label` to `"send"`, other options can be changed freely.

```python
send_transaction = wallet_connect(label="send", key="send", message="Send Transaction", contract_address="ERC20_ADDRESS", amount="10", to_address="RECIPIENT_ADDRESS")
```
Note: you need to specify the `contract_address` (the address of the ERC20 token that you want to send) and the recipients wallet address in `to_address`.

### Lit Protocol Components

The `streamlit-wallet-connect` package now adds a number of extensions to enable decentralized Web3 authentication of your Streamlit apps, powered by [Lit Protocol](https://litprotocol.com/).

The first component is a login button that allows you to hide content of a Streamlit app unless the user wallet holds a specific NFT (e.g. a reputation badge from your community). The login button returns `True` if the authentication was successful, otherwise it will throw an error (you can also check the logs in the browser console).

```python
login_button = wallet_connect(label="login", key="login", message="Login", auth_nft_contract_address="NFT_CONTRACT_ADDRESS")
```

Example
```python

login_button = wallet_connect(label="login", key="login", message="Login", auth_nft_contract_address="0x68085453B798adf9C09AD8861e0F0da96B908d81")

if login_button == True:
    st.write("Logged in!")
    # ...the rest of the Streamlit app
else:
    st.write("Not authorized to access this application.")
```