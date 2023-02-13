import streamlit.components.v1 as components
import streamlit as st
import os


parent_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(parent_dir, "frontend/build")
# _wallet_connect = components.declare_component("wallet_connect", path=build_dir)
_wallet_connect = components.declare_component("wallet_connect", url="http://localhost:3001")

# default contract address is for ocean token
def wallet_connect(label, key=None, message="Connect Wallet", contract_address="0xCfDdA22C9837aE76E0faA845354f33C62E03653a", amount="0.01", to_address="", message_to_encrypt="", encrypted_string="", encrypted_symmetric_key="", auth_token_contract_address="", chain_name="polygon", contract_type="ERC1155", num_tokens="0", price=10, supply=100, uri="", token_id=0):
    return _wallet_connect(
        label=label,
        default="not",
        key=key,
        message=message,
        contract_address=contract_address,
        amount=amount, to_address=to_address,
        message_to_encrypt=message_to_encrypt,
        encrypted_string=encrypted_string,
        encrypted_symmetric_key=encrypted_symmetric_key,
        auth_token_contract_address=auth_token_contract_address,
        chain_name=chain_name,
        contract_type=contract_type,
        num_tokens=num_tokens,
        price=price,
        supply=supply,
        uri=uri,
        token_id=token_id
        )


wallet_button = wallet_connect(label="wallet", key="wallet")
st.write(f"Wallet {wallet_button} connected.")

button = wallet_connect(message="Create Token", label="create_token", key="create_token", price="0.01", supply=1000, uri="https://gateway.pinata.cloud/ipfs/QmZrFfBGmUmXYUVeTrKdKC1aFeBBEEXQPGhsJtX45GwCC5", chain_name="goerli")
st.write(f"TokenId is {button}")

mint_button = wallet_connect(message="Login Algovera", label="mint_and_login_algovera", key="mint_and_login_algovera", price="0.01", token_id="1", chain_name="goerli")

if mint_button == True:
    st.write("Logged in!")
    st.image("dog.jpeg")
else:
    st.write("Not authorized to access this application.")