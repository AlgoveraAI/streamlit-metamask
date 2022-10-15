import streamlit.components.v1 as components
import streamlit as st
import os


parent_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(parent_dir, "frontend/build")
_wallet_connect = components.declare_component("wallet_connect", path=build_dir)
# _wallet_connect = components.declare_component("wallet_connect", url="http://localhost:3001")

# default contract address is for ocean token
def wallet_connect(label, key=None, message="Connect Wallet", contract_address="0xCfDdA22C9837aE76E0faA845354f33C62E03653a",amount="0.01", to_address=""):
    return _wallet_connect(label=label, default="not", key=key, message=message, contract_address=contract_address, amount=amount, to_address=to_address)


# wallet_button = wallet_connect(label="wallet", key="wallet")
# st.write(f"Wallet {wallet_button} connected.")
# second_button = wallet_connect(label="send", key="send", message="Send Transaction", contract_address="0xCfDdA22C9837aE76E0faA845354f33C62E03653a", amount="10", to_address="") # need to fill in to_address
