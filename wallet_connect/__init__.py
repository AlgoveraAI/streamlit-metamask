import streamlit.components.v1 as components
import streamlit as st

_wallet_connect = components.declare_component(
    "wallet_connect",
    url="http://localhost:3001"
)


def wallet_connect(label, key=None):
    return _wallet_connect(label=label, default="not", key=key)


wallet_button = wallet_connect(label="wallet", key="wallet")

st.write(f"Wallet {wallet_button} connected.")