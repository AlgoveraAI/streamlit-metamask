import WalletConnectProvider from "@walletconnect/ethereum-provider";
import {
  Web3Provider,
  JsonRpcSigner,
  JsonRpcProvider,
} from "@ethersproject/providers";
import { verifyMessage } from "@ethersproject/wallet";
import { toUtf8Bytes } from "@ethersproject/strings";
import { getAddress } from "@ethersproject/address";
import { Contract } from "@ethersproject/contracts";
import { hexlify } from "@ethersproject/bytes";
import { SiweMessage } from "lit-siwe";

import naclUtil from "tweetnacl-util";
import nacl from "tweetnacl";
import { ethers } from "ethers";

import LIT from "lit-js-sdk/src/abis/LIT.json";
import A from "./Algovera.json"
import { LIT_CHAINS } from "./litHelper";

const LitJsSdk = require("lit-js-sdk");


// Lit Protocol Integration
  
  // Helper functions
  
  async function getLitClient() {
    console.log("Lit!")
    const client = new LitJsSdk.LitNodeClient();
    await client.connect();
    window.litNodeClient = client;
    console.log("Lit client connected", client);
    console.log("Window.litNodeClient", window.litNodeClient);
  
    const chain = "ethereum";
    console.log("Chain", chain);
  
    const accessControlConditions = [
      {
        contractAddress: "",
        standardContractType: "",
        chain: chain,
        method: "eth_getBalance",
        parameters: [":userAddress", "latest"],
        returnValueTest: {
          comparator: ">=",
          value: "1000000000000", // 0.000001 ETH
        },
      },
    ];
  
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: chain });
    console.log("AuthSig", authSig)
  }
  
  
  
  async function connectWeb3({ chainId = 1 } = {}) {
    const rpcUrls: any = {};
    // need to make it look like this:
    // rpc: {
    //   1: "https://mainnet.mycustomnode.com",
    //   3: "https://ropsten.mycustomnode.com",
    //   100: "https://dai.poa.network",
    //   // ...
    // },
  
    for (let i = 0; i < Object.keys(LIT_CHAINS).length; i++) {
      const chainName = Object.keys(LIT_CHAINS)[i];
      const chainId = LIT_CHAINS[chainName].chainId;
      const rpcUrl = LIT_CHAINS[chainName].rpcUrls[0];
      rpcUrls[chainId] = rpcUrl;
    }
  
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: "cd614bfa5c2f4703b7ab0ec0547d9f81",
          rpc: rpcUrls,
          chainId,
        },
      },
    };
  
    console.log("getting provider via lit connect modal");
  
    const provider: any = new ethers.providers.Web3Provider(window.ethereum, "any")
  
    console.log("got provider", provider);
    // const web3 = new Web3Provider(provider);
    const web3 = provider;
  
    // const provider = await detectEthereumProvider();
    // const web3 = new Web3Provider(provider);
  
    // trigger metamask popup
    // await provider.enable();
    await provider.send("eth_requestAccounts", []);
  
    console.log("listing accounts");
    const accounts = await web3.listAccounts();
    // const accounts = await provider.request({
    //   method: "eth_requestAccounts",
    //   params: [],
    // });
    console.log("accounts", accounts);
    const account = accounts[0].toLowerCase();
  
    return { web3, account };
  }
  
  // wrapper around signMessage that tries personal_sign first.  this is to fix a
  // bug with walletconnect where just using signMessage was failing
  const signMessageAsync = async (signer: any, address: any, message: any) => {
    const messageBytes = toUtf8Bytes(message);
    if (signer instanceof JsonRpcSigner) {
      try {
        console.log("Signing with personal_sign");
        const signature = await signer.provider.send("personal_sign", [
          hexlify(messageBytes),
          address.toLowerCase(),
        ]);
        return signature;
      } catch (e) {
        console.log(
          "Signing with personal_sign failed, trying signMessage as a fallback"
        );
        let message: any
        if (e instanceof Error) message = e.message
        if (message.includes("personal_sign")) {
          return await signer.signMessage(messageBytes);
        }
        throw e;
      }
    } else {
      console.log("signing with signMessage");
      return await signer.signMessage(messageBytes);
    }
  };
  
  /**
   * @typedef {Object} AuthSig
   * @property {string} sig - The actual hex-encoded signature
   * @property {string} derivedVia - The method used to derive the signature. Typically "web3.eth.personal.sign"
   * @property {string} signedMessage - The message that was signed
   * @property {string} address - The crypto wallet address that signed the message
   */
  
   export async function signMessage({ body, web3, account }: any) {
    if (!web3 || !account) {
      let resp = await connectWeb3();
      web3 = resp.web3;
      account = resp.account;
    }
  
    console.log("pausing...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("signing with ", account);
    // const signature = await web3.getSigner().signMessage(body);
    const signature = await signMessageAsync(web3.getSigner(), account, body);
    //.request({ method: 'personal_sign', params: [account, body] })
    const address = verifyMessage(body, signature).toLowerCase();
  
    console.log("Signature: ", signature);
    console.log("recovered address: ", address);
  
    if (address !== account) {
      const msg = `ruh roh, the user signed with a different address (${address}) then they\'re using with web3 (${account}).  this will lead to confusion.`;
      console.error(msg);
      alert(
        "something seems to be wrong with your wallets message signing.  maybe restart your browser or your wallet.  your recovered sig address does not match your web3 account address"
      );
      throw new Error(msg);
    }
  
    return { signature, address };
  }
  
  
  /**
   * Sign the auth message with the user's wallet, and store it in localStorage.  Called by checkAndSignAuthMessage if the user does not have a signature stored.
   * @param {Object} params
   * @param {Web3Provider} params.web3 An ethers.js Web3Provider instance
   * @param {string} params.account The account to sign the message with
   * @returns {AuthSig} The AuthSig created or retrieved
  */
  async function signAndSaveAuthMessage({
    web3,
    account,
    chainId,
    resources,
  }: any) {
    // const { chainId } = await web3.getNetwork();
  
    const preparedMessage: any = {
      domain: globalThis.location.host,
      address: getAddress(account), // convert to EIP-55 format or else SIWE complains
      uri: globalThis.location.origin,
      version: "1",
      chainId,
    };
  
    if (resources && resources.length > 0) {
      preparedMessage.resources = resources;
    }
  
    const message = new SiweMessage(preparedMessage);
  
    const body = message.prepareMessage();
  
    const signedResult = await signMessage({
      body,
      web3,
      account,
    });
  
    const authSig = {
      sig: signedResult.signature,
      derivedVia: "web3.eth.personal.sign",
      signedMessage: body,
      address: signedResult.address,
    };
  
    localStorage.setItem("lit-auth-signature", JSON.stringify(authSig));
    // store a keypair in localstorage for communication with sgx
    const commsKeyPair = nacl.box.keyPair();
    localStorage.setItem(
      "lit-comms-keypair",
      JSON.stringify({
        publicKey: naclUtil.encodeBase64(commsKeyPair.publicKey),
        secretKey: naclUtil.encodeBase64(commsKeyPair.secretKey),
      })
    );
    console.log("generated and saved lit-comms-keypair");
    return authSig;
  }
  
async function checkAndSignEVMAuthMessage({
    chain,
    resources,
    switchChain,
  }: any) {
    const selectedChain = LIT_CHAINS[chain];
    const { web3, account } = await connectWeb3({
      chainId: selectedChain.chainId,
    });
    console.log(`got web3 and account: ${account}`);
  
    let chainId;
    try {
      const resp = await web3.getNetwork();
      chainId = resp.chainId;
    } catch (e) {
      // couldn't get chainId.  throw the incorrect network error
      console.log("getNetwork threw an exception", e);
      // throwError({
      //   message: `Incorrect network selected.  Please switch to the ${chain} network in your wallet and try again.`,
      //   name: "WrongNetworkException",
      //   errorCode: "wrong_network",
      // });
    }
    let selectedChainId = "0x" + selectedChain.chainId.toString("16");
    console.log("chainId from web3", chainId);
    console.log(
      `checkAndSignAuthMessage with chainId ${chainId} and chain set to ${chain} and selectedChain is `,
      selectedChain
    );
    if (chainId !== selectedChain.chainId && switchChain) {
      if (web3.provider instanceof WalletConnectProvider) {
        // this chain switching won't work.  alert the user that they need to switch chains manually
        // throwError({
        //   message: `Incorrect network selected.  Please switch to the ${chain} network in your wallet and try again.`,
        //   name: "WrongNetworkException",
        //   errorCode: "wrong_network",
        // });
        return;
      }
      try {
        console.log("trying to switch to chainId", selectedChainId);
        await web3.provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: selectedChainId }],
        });
      } catch (switchError) {
        console.log("error switching to chainId", switchError);
        // This error code indicates that the chain has not been added to MetaMask.
        // if (switchError.code === 4902) {
          try {
            const data = [
              {
                chainId: selectedChainId,
                chainName: selectedChain.name,
                nativeCurrency: {
                  name: selectedChain.name,
                  symbol: selectedChain.symbol,
                  decimals: selectedChain.decimals,
                },
                rpcUrls: selectedChain.rpcUrls,
                blockExplorerUrls: selectedChain.blockExplorerUrls,
              },
            ];
            await web3.provider.request({
              method: "wallet_addEthereumChain",
              params: data,
            });
          } catch (addError) {
            // handle "add" error
            // if (addError.code === -32601) {
            //   // metamask code indicating "no such method"
            //   // throwError({
            //   //   message: `Incorrect network selected.  Please switch to the ${chain} network in your wallet and try again.`,
            //   //   name: "WrongNetworkException",
            //   //   errorCode: "wrong_network",
            //   // });
            // } else {
              throw addError;
            // }
          }
        // } else {
        //   if (switchError.code === -32601) {
        //     // metamask code indicating "no such method"
        //     // throwError({
        //     //   message: `Incorrect network selected.  Please switch to the ${chain} network in your wallet and try again.`,
        //     //   name: "WrongNetworkException",
        //     //   errorCode: "wrong_network",
        //     // });
        //   } else {
        //     throw switchError;
        //   }
        // }
      }
      // we may have switched the chain to the selected chain.  set the chainId accordingly
      chainId = selectedChain.chainId;
    }
    console.log("checking if sig is in local storage");
    let authSig: any = localStorage.getItem("lit-auth-signature");
    if (!authSig) {
      console.log("signing auth message because sig is not in local storage");
      await signAndSaveAuthMessage({
        web3,
        account,
        chainId,
        resources,
      });
      authSig = localStorage.getItem("lit-auth-signature");
    }
    authSig = JSON.parse(authSig);
    // make sure we are on the right account
    if (account !== authSig.address) {
      console.log(
        "signing auth message because account is not the same as the address in the auth sig"
      );
      await signAndSaveAuthMessage({
        web3,
        account,
        chainId: selectedChain.chainId,
        resources,
      });
      authSig = localStorage.getItem("lit-auth-signature");
      authSig = JSON.parse(authSig);
    } else {
      // check the resources of the sig and re-sign if they don't match
      let mustResign = false;
      try {
        const parsedSiwe = new SiweMessage(authSig.signedMessage);
        console.log("parsedSiwe.resources", parsedSiwe.resources);
  
        if (JSON.stringify(parsedSiwe.resources) !== JSON.stringify(resources)) {
          console.log(
            "signing auth message because resources differ from the resources in the auth sig"
          );
          mustResign = true;
        } else if (parsedSiwe.address !== getAddress(parsedSiwe.address)) {
          console.log(
            "signing auth message because parsedSig.address is not equal to the same address but checksummed.  This usually means the user had a non-checksummed address saved and so they need to re-sign."
          );
          mustResign = true;
        }
      } catch (e) {
        console.log("error parsing siwe sig.  making the user sign again: ", e);
        mustResign = true;
      }
      if (mustResign) {
        await signAndSaveAuthMessage({
          web3,
          account,
          chainId: selectedChain.chainId,
          resources,
        });
        authSig = localStorage.getItem("lit-auth-signature");
        authSig = JSON.parse(authSig);
      }
    }
    console.log("got auth sig", authSig);
    return authSig;
  }
  
  async function checkAndSignAuthMessage({
    chain,
    resources,
    switchChain = true,
  }: any) {
    return checkAndSignEVMAuthMessage({ chain, resources, switchChain });
  }
  
  
  
  // End Helper function
  
  
  
  
  
  
  // Set up the middleware stack
  async function getAuthSig(chain: string) {
    const authSig = await checkAndSignAuthMessage({chain: chain});
    window.authSig = authSig;
    return authSig
  }
  
  async function getClient() {
    const litNodeClient = new LitJsSdk.LitNodeClient();
    await litNodeClient.connect();
    window.litNodeClient = litNodeClient;
  
    return litNodeClient
  }
  
  
export async function encrypt(messageToEncrypt: string, chainName: string) {
    const litNodeClient = await getClient();
    const accessControlConditions = [
      {
        contractAddress: '0x68085453B798adf9C09AD8861e0F0da96B908d81',
        standardContractType: "ERC1155",
        chain: chainName,
        method: "balanceOf",
        parameters: [":userAddress", '0', '1', '2', '3', '4', '5' ],
        returnValueTest: {
          comparator: ">",
          value: "0",
        },
      },
    ];
    console.log("getting authSig");
    const authSig = await getAuthSig(chainName);
    console.log("got authSig ", authSig);
    const chain = chainName;
  
    // encrypting content -> this we can change to our own content
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
        messageToEncrypt
    );
    // saving encrypted content to Lit Node
    const encryptedSymmetricKey = await window.litNodeClient.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain,
    });

    window.encryptedString = encryptedString;
    const encryptedRealString = await LitJsSdk.blobToBase64String(encryptedString)

  
    return {
      encryptedRealString,
      encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
    }
}
  
  
export async function decrypt(encryptedRealString: string, encryptedSymmetricKey: string, chainName: string) {
    console.log("Decrypting...")
    const encryptedString = LitJsSdk.base64StringToBlob(encryptedRealString)
    const litNodeClient = await getClient();
  
    const authSig = await getAuthSig(chainName);
  
    const chain = chainName;
    window.accessControlConditions = [
      {
        contractAddress: '0x68085453B798adf9C09AD8861e0F0da96B908d81',
        standardContractType: "ERC1155",
        chain: chainName,
        method: "balanceOf",
        parameters: [":userAddress", '0', '1', '2', '3', '4', '5' ],
        returnValueTest: {
          comparator: ">",
          value: "0",
        },
      },
    ];
    const accessControlConditions = window.accessControlConditions;
  
    const symmetricKey = await litNodeClient.getEncryptionKey({
      accessControlConditions,
      toDecrypt: encryptedSymmetricKey,
      chain,
      authSig
    })
  
    const decryptedString = await LitJsSdk.decryptString(
      encryptedString,
      symmetricKey
    );
  
    return { decryptedString }
}

async function provisionAccess2(contractType: string="ERC1155") {
      window.accessControlConditions = [
        {
          contractAddress: LitJsSdk.LIT_CHAINS[window.chain].contractAddress,
          standardContractType: contractType,
          chain: window.chain,
          method: 'balanceOf',
          parameters: [
            ':userAddress',
            window.tokenId.toString()
          ],
          returnValueTest: {
            comparator: '>',
            value: '0'
          }
        }
      ]
      // generate a random path because you can only provision access to a given path once
      const randomUrlPath = "/" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      window.resourceId = {
        baseUrl: 'my-dynamic-content-server.com',
        path: randomUrlPath, // this would normally be your url path, like "/webpage.html" for example
        orgId: "",
        role: "",
        extraData: ""
      }

      const client = new LitJsSdk.LitNodeClient();
        await client.connect();
        window.litNodeClient = client;
        console.log("Lit client connected", client);
        console.log("Window.litNodeClient", window.litNodeClient);

      await client.saveSigningCondition({
        accessControlConditions: window.accessControlConditions,
        chain: window.chain,
        authSig: window.authSig,
        resourceId: window.resourceId
      })
    }

async function provisionAccess3(contractType: string="ERC1155", contractAddress: string, tokenId: any, chainName: string) {

      window.accessControlConditions = [
        {
          contractAddress: contractAddress,
          standardContractType: contractType,
          chain: window.chain,
          method: 'balanceOf',
          parameters: [
            ':userAddress',
            tokenId,
          ],
          returnValueTest: {
            comparator: '>',
            value: '0'
          }
        }
      ]
      // generate a random path because you can only provision access to a given path once
      const randomUrlPath = "/" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      window.resourceId = {
        baseUrl: 'my-dynamic-content-server.com',
        path: randomUrlPath, // this would normally be your url path, like "/webpage.html" for example
        orgId: "",
        role: "",
        extraData: ""
      }

      const client = new LitJsSdk.LitNodeClient();
        await client.connect();
        window.litNodeClient = client;
        console.log("Lit client connected", client);
        console.log("Window.litNodeClient", window.litNodeClient);

      await client.saveSigningCondition({
        accessControlConditions: window.accessControlConditions,
        chain: chainName,
        authSig: window.authSig,
        resourceId: window.resourceId
      })
}

async function provisionAccess(contractAddress: string, chainName: string, contractType: string="ERC1155", numTokens: string="0") {
    window.accessControlConditions = [
      {
        contractAddress: contractAddress,
        standardContractType: contractType,
        chain: chainName,
        method: "balanceOf",
        parameters: [":userAddress", '0', '1', '2', '3', '4', '5' ],
        returnValueTest: {
          comparator: ">",
          value: numTokens,
        },
      },
    ];
    // generate a random path because you can only provision access to a given path once
    const randomUrlPath =
      "/" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    window.resourceId = {
      baseUrl: "lit-estuary-storage.herokuapp.com/",
      path: randomUrlPath, // this would normally be our url path, like "/algovera.storage" for example
      orgId: "",
      role: "",
      extraData: "",
    };

    const client = new LitJsSdk.LitNodeClient();
    await client.connect();
    window.litNodeClient = client;
    console.log("Lit client connected", client);
    console.log("Window.litNodeClient", window.litNodeClient);


    await client.saveSigningCondition({
      accessControlConditions: window.accessControlConditions,
      chain: chainName,
      authSig: window.authSig,
      resourceId: window.resourceId,
    });
}

async function requestJwt(chainName: string) {
    console.log("IN REQUEST JWT")
    const client = new LitJsSdk.LitNodeClient();
    await client.connect();
    window.litNodeClient = client;
    console.log("Lit client connected", client);
    console.log("Window.litNodeClient", window.litNodeClient);

      console.log("Checking params for jwt")
      console.log("window.accessControlConditions is ", window.accessControlConditions)
      console.log("chainName is ", chainName)
      console.log("Auth Sig is ", window.authSig)
      console.log("window.resourceId is ", window.resourceId)

    window.jwt = await client.getSignedToken({
      accessControlConditions: window.accessControlConditions,
      chain: chainName,
      authSig: window.authSig,
      resourceId: window.resourceId,
    });
    console.log("What is window.jwt? ", window.jwt)

}

// async function visitProtectedServer(jwt) {
//     window.location = "/?jwt=" + window.jwt;
// }


async function mintAlgovera(tknId: any, quantity: number, price: string) {
  console.log(`minting ${quantity} tokens on ${window.chain}`);
  try {
    const chain = window.chain
    const authSig = await checkAndSignEVMAuthMessage({
      chain,
      switchChain: true,
    });
    if (authSig.errorCode) {
      return authSig;
    }
    const { web3, account } = await connectWeb3();
    const signer = web3.getSigner()
    const tokenAddress = "0x35cA20b4c393dD3C425565E0DC2059Eebe9e1422";
    if (!tokenAddress) {
      console.log("No token address for this chain.  It's not supported via MintLIT.");
      return;
    }

    const contract = new Contract(tokenAddress, A.abi, web3.getSigner());
    console.log("sending to chain...");
    console.log("line 940")
    const methodSignature = await contract.interface.encodeFunctionData(
      "mint",
      [tknId] 
    );
    console.log("Got here")
    console.log("Price is ", price)
    console.log("Price parsed in ehters is ", ethers.utils.parseUnits(price))
    const txnParams = {
      to: tokenAddress,
      value: ethers.utils.parseUnits(price), 
      data: methodSignature,
      from: account,
    };
    console.log("Got txnParams")
    // const gasEstimate = await signer.estimateGas(txnParams);
    // console.log("Gas estimate:", gasEstimate.toString());
    
    // send transaction
    const txn = await signer.sendTransaction({
      to: "0x35cA20b4c393dD3C425565E0DC2059Eebe9e1422",
      value: ethers.utils.parseUnits(price), 
      data: methodSignature,
      gasLimit: 3e6, //gasEstimate,
    });
    console.log("Transaction:", txn);
    console.log("sent to chain.  waiting to be mined...");

    // wait for transaction to be mined
    const receipt = await txn.wait();
    console.log("Receipt:", receipt);



    
    
    // const tx = await contract.mint(tknId, quantity);
    // console.log("sent to chain.  waiting to be mined...");
    // const txReceipt = await tx.wait();
    // console.log("txReceipt: ", txReceipt);
    // const tokenId = txReceipt.events[0].args[3].toNumber();
    return {
      txHash: receipt.transactionHash,
      tknId,
      tokenAddress,
      mintingAddress: account,
      authSig,
    };
  } catch (error) {
    console.log(error);
    return { errorCode: "unknown_error" };
  }
}

export async function initToken(price: string, supply: number, uri: string) {
  try {
    const { web3, account } = await connectWeb3();
    const tokenAddress = "0x35cA20b4c393dD3C425565E0DC2059Eebe9e1422";
    const contract = new Contract(tokenAddress, A.abi, web3.getSigner());
    console.log("sending to chain...");
    const tx = await contract.createToken(ethers.utils.parseUnits(price), uri, supply); //createToken(100, uri, 1000)
    console.log("sent to chain.  waiting to be mined...");
    const txReceipt = await tx.wait();
    console.log("txReceipt: ", txReceipt);
    const tokenId = parseInt(txReceipt.events[0].data, 16)
    return tokenId;
  } catch (error) {
    console.log(error);
    return { errorCode: "unknown_error" };
  }
}

async function mintNftAlgovera(chainName: string, tknId: any, price: string) {
  console.log("Minting NFT, please wait for the tx to confirm...")

  window.chain = chainName

  const {
    txHash,
    tokenId,
    tokenAddress,
    mintingAddress,
    authSig
  } = await mintAlgovera(tknId, 1, price)
  // window.tokenId = tokenId
  // window.tokenAddress = tokenAddress
  // window.authSig = authSig
  // console.log("Algovera NFT has been minted and the authSig is ", window.authSig)

  return txHash
}



/**
 * This function mints a LIT using our pre-deployed token contracts.  You may use our contracts, or you may supply your own.  Our contracts are ERC1155 tokens on Polygon and Ethereum.  Using these contracts is the easiest way to get started.
 * @param {Object} params
 * @param {string} params.chain The chain to mint on.  "ethereum" and "polygon" are currently supported.
 * @param {number} params.quantity The number of tokens to mint.  Note that these will be fungible, so they will not have serial numbers.
 * @returns {Object} The txHash, tokenId, tokenAddress, mintingAddress, and authSig.
 */
async function mintLIT({ chain, quantity }: any) {
    console.log(`minting ${quantity} tokens on ${chain}`);
    try {
      const authSig = await checkAndSignEVMAuthMessage({
        chain,
        switchChain: true,
      });
      if (authSig.errorCode) {
        return authSig;
      }
      const { web3, account } = await connectWeb3();
      const tokenAddress = LIT_CHAINS[chain].contractAddress;
      if (!tokenAddress) {
        console.log("No token address for this chain.  It's not supported via MintLIT.");
        return;
      }
      const contract = new Contract(tokenAddress, LIT.abi, web3.getSigner());
      console.log("sending to chain...");
      const tx = await contract.mint(quantity);
      console.log("sent to chain.  waiting to be mined...");
      const txReceipt = await tx.wait();
      console.log("txReceipt: ", txReceipt);
      const tokenId = txReceipt.events[0].args[3].toNumber();
      return {
        txHash: txReceipt.transactionHash,
        tokenId,
        tokenAddress,
        mintingAddress: account,
        authSig,
      };
    } catch (error) {
      console.log(error);
      return { errorCode: "unknown_error" };
    }
  }

async function mintNft(chainName: string) {
    console.log("Minting NFT, please wait for the tx to confirm...")

    window.chain = chainName

    const {
      txHash,
      tokenId,
      tokenAddress,
      mintingAddress,
      authSig
    } = await mintLIT({ chain: window.chain, quantity: 1 })
    window.tokenId = tokenId
    window.tokenAddress = tokenAddress
    window.authSig = authSig

    return txHash
}

export async function login(contractAddress: string, chainName: string, contractType: string="ERC1155", numTokens: string="0") {
    try {
        await getAuthSig(chainName);
        await provisionAccess(contractAddress, chainName, contractType, numTokens);
        await requestJwt(chainName);
        console.log("You're logged in!");
        console.log("window.jwt", window.jwt);
        return true
    } catch (e) {
        console.log("Error", e);
        return false
    }
    // document.getElementById("authStatus").innerText =
    // "You've been authenticated!";
    // await visitProtectedServer(window.jwt);
}

export async function mintAndLogin(chainName: string, contractType: string="ERC1155") {
    try {
        await getAuthSig(chainName);
        const tx = await mintNft(chainName)
        console.log("tx", tx)
        await provisionAccess2(contractType);
        await requestJwt(chainName);
        console.log("You're logged in!");
        console.log("window.jwt", window.jwt);
        return true
    } catch (e) {
        console.log("Error", e);
        return false
    }
}

export async function mintAndLoginAlgovera(chainName: string, tknId: any, price: string) {
  try {
      await getAuthSig(chainName);
      const tx = await mintNftAlgovera(chainName, tknId, price)
      console.log("tx", tx)
      console.log("Provisioning Access 3")
      await provisionAccess3("ERC1155", A.address, tknId, chainName);
      console.log("Requesting JWT")
      await requestJwt(chainName);
      console.log("You're logged in!");
      console.log("window.jwt", window.jwt);
      return true
  } catch (e) {
      console.log("Error", e);
      return false
  }
}

export async function loginAlgovera(chainName: string, tknId: any) {
  try {
      await getAuthSig(chainName);
      console.log("Provisioning Access 3")
      await provisionAccess3("ERC1155", A.address, tknId, chainName);
      console.log("Requesting JWT")
      await requestJwt(chainName);
      console.log("You're logged in!");
      console.log("window.jwt", window.jwt);
      return true
  } catch (e) {
      console.log("Error", e);
      return false
  }
}


// End Lit Protocol Integration