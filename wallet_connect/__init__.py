import streamlit.components.v1 as components
import streamlit as st
import os


parent_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(parent_dir, "frontend/build")
_wallet_connect = components.declare_component("wallet_connect", path=build_dir)
# _wallet_connect = components.declare_component("wallet_connect", url="http://localhost:3001")

# default contract address is for ocean token
def wallet_connect(label, key=None, message="Connect Wallet", contract_address="0xCfDdA22C9837aE76E0faA845354f33C62E03653a", amount="0.01", to_address="", message_to_encrypt="", encrypted_string="", encrypted_symmetric_key="", auth_token_contract_address="", chain_name="polygon", contract_type="ERC1155", num_tokens="0"):
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
        num_tokens=num_tokens
        )


# wallet_button = wallet_connect(label="wallet", key="wallet")
# st.write(f"Wallet {wallet_button} connected.")
# # second_button = wallet_connect(label="send", key="send", message="Send Transaction", contract_address="0xCfDdA22C9837aE76E0faA845354f33C62E03653a", amount="10", to_address="") # need to fill in to_address
# message_to_encrypt = st.text_input("Message to encrypt")
# encrypt_button = wallet_connect(label="encrypt", key="encrypt", message="Encrypt", message_to_encrypt=message_to_encrypt)
# st.write(encrypt_button)

# # st.session_state["encrypted_string"] = encrypt_button["encryptedString"]
# # st.session_state["encrypted_symmetric_key"] = encrypt_button["encryptedSymmetricKey"]
# encrypted_string = st.text_input("Enter string to decrypt")
# encrypted_symmetric_key = st.text_input("Enter symmetric key")

# decrypt_button = wallet_connect(label="decrypt", key="decrypt", message="Decrypt", encrypted_string=encrypted_string, encrypted_symmetric_key=encrypted_symmetric_key)
# st.write(decrypt_button)

# login_button = wallet_connect(label="login", key="login", message="Login", auth_token_contract_address="0x68085453B798adf9C09AD8861e0F0da96B908d81", chain_name="polygon", contract_type="ERC1155", num_tokens="0")
# mint_button = wallet_connect(label="mint", key="mint_and_login", message="Mint and Login")
# if login_button == True:
#     st.write("Logged in!")
# else:
#     st.write("Not authorized to access this application.")
