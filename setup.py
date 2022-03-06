import setuptools

setuptools.setup(
    name="streamlit-metamask-component",
    version="0.0.1",
    author="AlgoveraAI",
    author_email="hello@algovera.ai",
    description="A component for integrating the MetaMask wallet with Streamlit",
    long_description="",
    long_description_content_type="text/plain",
    url="www.algovera.ai",
    packages=setuptools.find_packages(),
    include_package_data=True,
    classifiers=[],
    python_requires=">=3.6",
    install_requires=[
        # By definition, a Custom Component depends on Streamlit.
        # If your component has other Python dependencies, list
        # them here.
        "streamlit >= 0.63",
    ],
)
