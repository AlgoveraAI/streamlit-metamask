import os
import streamlit.components.v1 as components
import streamlit as st

st.title("Debug Session")

_wallet_connect = components.declare_component(
    "wallet_connect",
    url="http://localhost:3001"
)

def wallet_callback():
    st.write("executed callback")

def wallet_connect(key=None):
   return _wallet_connect(default="0x", key=key, on_click=wallet_callback)

return_value = wallet_connect()
st.write(return_value)