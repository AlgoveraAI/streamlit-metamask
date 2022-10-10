import streamlit.components.v1 as components
import streamlit as st
import os


parent_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(parent_dir, "frontend/build")
# _wallet_connect = components.declare_component("wallet_connect", path=build_dir)
_wallet_connect = components.declare_component("wallet_connect", url="http://localhost:3001")


def wallet_connect(label, key=None, message="Connect Wallet"):
    return _wallet_connect(label=label, default="not", key=key, message=message)


wallet_button = wallet_connect(label="wallet", key="wallet")
second_button = wallet_connect(label="send", key="send", message="Send Transaction")

# st.write(f"Wallet {wallet_button} connected.")