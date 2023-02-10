import { Contract } from "@ethersproject/contracts";

import { ethers } from "ethers";

import LIT from "lit-js-sdk/src/abis/LIT.json";
import A from "./Algovera.json"
import { LIT_CHAINS, checkAndSignAuthMessage, checkAndSignEVMAuthMessage, connectWeb3 } from "./litHelper";

const LitJsSdk = require("lit-js-sdk");


// Lit Protocol Integration

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
    const tx = await mintNftAlgovera(chainName, tknId, price)
    await getAuthSig(chainName);
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




// End Lit Protocol Integration