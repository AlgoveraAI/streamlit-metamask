# 🦊 Web3 Streamlit Components

(previously Streamlit MetaMask Component)

This repository contains the code behind the Web3 Streamlit Components that you can use to turn your Streamlit apps into dapps interacting with Web3.

The current documentation is available [here](docs.md).

## 🏗 Development

### Set up your development environment

```
conda create -n streamlit-dev -c conda-forge nodejs python=3.8

# Activate the conda environment
conda activate streamlit-dev

# Install streamlit
pip install streamlit

# Install Watchdog for better performance (according to Streamlit)
pip install watchdog
```

- open two terminal windows/panes, one with the `wallet_connect/frontend` folder open, other with the main repo folder
- in `frontend` folder, run `npm install`
    - then `npm start`
- in the main repo run `streamlit run wallet_connect/__init__.py`
