import streamlit.components.v1 as components
import streamlit as st
import os

from ocean_lib.config import Config
from ocean_lib.ocean.ocean import Ocean
from ocean_lib.web3_internal.wallet import Wallet
from ocean_lib.web3_internal.currency import pretty_ether_and_wei, to_wei
from ocean_lib.web3_internal.constants import ZERO_ADDRESS
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

config = Config('./wallet_connect/config.ini')
ocean = Ocean(config)

def search(term="", did_in="", address=""):
    """
    Search for an asset on the Ocean Marketplace.
    """

    if address:
        wallet = Wallet(ocean.web3, private_key=address, transaction_timeout=20, block_confirmations=0)
    
    results = None
    dids = None
    data=None
    if term and not did_in:
        assets = ocean.assets.search(term)

        results = []
        datas = []
        balances = []
        dids = []
        for i in range(len(assets)):
            name = assets[i].values['_source']['service'][0]['attributes']['main']['name']
            type_ = assets[i].values['_source']['service'][0]['attributes']['main']['type'].upper()
            symbol = assets[i].values['_source']['dataTokenInfo']['symbol']
            data_token_address = assets[i].values['_source']['dataTokenInfo']['address']
            try:
                description = assets[i].values['_source']['service'][0]['attributes']['additionalInformation']['description']
            except:
                description = "No description"
            author = assets[i].values['_source']['service'][0]['attributes']['main']['author']
            did = assets[i].values['_source']['id']
            dids.append(did)
            chain = assets[i].values['_source']['service'][1]['serviceEndpoint']
            
            if chain != 'https://provider.rinkeby.oceanprotocol.com':
                continue
            
            if address:
                data_token = ocean.get_datatoken(data_token_address)
                token_address = data_token.address
                balances.append(pretty_ether_and_wei(data_token.balanceOf(wallet.address)))
            else:
                balances.append(0)
            
            img = Image.open('algovera-tile.png')

            fig = plt.figure(figsize=(5,5))
            plt.axis("off")
            plt.imshow(img)
            plt.text(20, 100, name[:22], size=20)
            plt.text(20, 60, symbol)
            plt.text(400, 40, type_)
            plt.text(20, 140, author, size=12)
            plt.text(20, 200, description[:50])
            fig.tight_layout()
            fig.canvas.draw()
            data = np.frombuffer(fig.canvas.tostring_rgb(), dtype=np.uint8)
            datas.append(data.reshape(fig.canvas.get_width_height()[::-1] + (3,)))
            plt.close()
            
            results.append([dids[-1], datas[-1], balances[-1]])

    
    if did_in:
        results = []
        balances = []
        datas = []
        dids = []
        
        asset = ocean.assets.resolve(did_in)        
        name = asset.as_dictionary()['service'][0]['attributes']['main']['name']
        type_ = asset.as_dictionary()['service'][0]['attributes']['main']['type'].upper()
        symbol = asset.as_dictionary()['dataTokenInfo']['symbol']
        try:
            description = asset.as_dictionary()['service'][0]['attributes']['additionalInformation']['description']
        except:
            description = "No description"
        author = asset.as_dictionary()['service'][0]['attributes']['main']['author']
        dids.append(did_in)
        chain = asset.as_dictionary()['service'][1]['serviceEndpoint']
        
        if chain != 'https://provider.rinkeby.oceanprotocol.com':
            pass
        
        if address:
            data_token = ocean.get_datatoken(asset.datatokens[0]["address"])
            token_address = data_token.address
            balances.append(pretty_ether_and_wei(data_token.balanceOf(wallet.address)))
        else:
            balances.append(0)
        
        
        
        img = Image.open('algovera-tile.png')

        fig = plt.figure(figsize=(5,5))
        plt.axis("off")
        plt.imshow(img)
        plt.text(20, 100, name[:22], size=20)
        plt.text(20, 60, symbol)
        plt.text(400, 40, type_)
        plt.text(20, 140, author, size=12)
        plt.text(20, 200, description[:50])
        fig.tight_layout()
        fig.canvas.draw()
        data = np.frombuffer(fig.canvas.tostring_rgb(), dtype=np.uint8)
        datas.append(data.reshape(fig.canvas.get_width_height()[::-1] + (3,)))
        plt.close()
        
        results.append([dids[-1], datas[-1], balances[-1]])

    return results 


term = st.text_input("Search for an asset by name", "")
did = st.text_input("Search for an asset by DID", "")
address = st.text_input("Insert address private key", "")

st.button("Search", on_click=search(term, did, address))