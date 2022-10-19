# 🦊 Web3 Streamlit Components

(previously Streamlit MetaMask Component)

This repository contains the code behind the Web3 Streamlit Components that you can use to turn your Streamlit apps into dapps interacting with Web3.

The current documentation is available [here](docs.md).

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

## 🏗 Development

### Set up your development environment

```
conda create -n streamlit-dev -c conda-forge nodejs python=3.8

# Activate the conda environment
conda activate streamlit-dev

# Install streamlit
pip install streamlit

# Install Watchdog for better performance (according to Streamlit)
pip install watchdog
```

- open two terminal windows/panes, one with the `wallet_connect/frontend` folder open, other with the main repo folder
- in `frontend` folder, run `npm install`
    - then `npm start`
- in the main repo run `streamlit run wallet_connect/__init__.py`
