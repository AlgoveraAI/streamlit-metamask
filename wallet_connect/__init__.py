import streamlit.components.v1 as components
import streamlit as st
import os


parent_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(parent_dir, "frontend/build")
# _wallet_connect = components.declare_component("wallet_connect", path=build_dir)
_wallet_connect = components.declare_component("wallet_connect", url="http://localhost:3001")


def wallet_connect(label, key=None, message="Connect Wallet", amount="0.01", to=""):
    return _wallet_connect(label=label, default="not", key=key, message=message, amount=amount, to=to)


wallet_button = wallet_connect(label="wallet", key="wallet")
st.write(f"Wallet {wallet_button} connected.")
second_button = wallet_connect(label="send", key="send", message="Send Transaction", amount="0.01", to="")
