import os
import streamlit.components.v1 as components
import streamlit as st

_my_component = components.declare_component(
    "my_component",
    url="http://localhost:3001"
)

def my_component(greeting, name="Streamlit", key=None):
   return  _my_component(greeting=greeting, name=name, default=0, key=key)


return_value = my_component("Hello", "John")
st.write(return_value)