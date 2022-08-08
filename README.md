# 🦊 Streamlit MetaMask component

This repository contains the code behind the Streamlit MetaMask component that you can use to turn your Streamlit apps into dapps.


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
