import streamlit.components.v1 as components
import streamlit as st
import os

from PIL import Image

import matplotlib.pyplot as plt
import numpy as np

parent_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(parent_dir, "frontend/build")
_wallet_connect = components.declare_component("wallet_connect", path=build_dir)


def wallet_connect(label, key=None):
    """
    Wallet Connect component.
    """
    return _wallet_connect(label=label, default="not", key=key)


wallet_button = wallet_connect(label="wallet", key="wallet")

st.write(f"Wallet {wallet_button} connected.")

term = st.text_input("Search for an asset by name", "")
did = st.text_input("Search for an asset by DID", "")
address = st.text_input("Insert address private key", "")