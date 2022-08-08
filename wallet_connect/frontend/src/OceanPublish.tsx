import { SHA256 } from 'crypto-js'
import {
      FixedRateExchange,
      getHash,
      Nft,
      NftFactory,
      ProviderInstance,
      ZERO_ADDRESS
} from '@oceanprotocol/lib'

import Web3 from 'web3'
import fs from 'fs'
import homedir from 'os'

async function publish() {
    // 0. SETUP
    let config
    let providerUrl
    let publisherAccount
    let addresses
    let freNftAddress
    let freDatatokenAddress
    let freAddress
    let freId

    const FRE_NFT_NAME = 'Datatoken 2'
    const FRE_NFT_SYMBOL = 'DT2'

    const ASSET_URL = {
        datatokenAddress: '0x0',
        nftAddress: '0x0',
        files: [
        {
            type: 'url',
            url: 'https://raw.githubusercontent.com/oceanprotocol/testdatasets/main/shs_dataset_test.txt',
            method: 'GET'
        }
        ]
    }

    const DDO = {
        '@context': ['https://w3id.org/did/v1'],
        id: '',
        version: '4.1.0',
        chainId: 4,
        nftAddress: '0x0',
        metadata: {
        created: '2021-12-20T14:35:20Z',
        updated: '2021-12-20T14:35:20Z',
        type: 'dataset',
        name: 'dataset-name',
        description: 'Ocean protocol test dataset description',
        author: 'oceanprotocol-team',
        license: 'MIT'
        },
        services: [
        {
            id: 'testFakeId',
            type: 'access',
            files: '',
            datatokenAddress: '0x0',
            serviceEndpoint: 'https://v4.provider.rinkeby.oceanprotocol.com',
            timeout: 0
        }
        ]
    }

    config = {
    'network': 'rinkeby',
    'nodeUri': 'https://rinkeby.infura.io/v3',
    'BLOCK_CONFIRMATIONS': 0,
    'metadataCacheUri' : 'https://v4.aquarius.oceanprotocol.com',
    'providerUri' : 'https://v4.provider.rinkeby.oceanprotocol.com',
    'downloads.path': 'consume-downloads',
    }
    providerUrl = config.providerUri

    console.log(`Aquarius URL: ${config.metadataCacheUri}`)
    console.log(`Provider URL: ${providerUrl}`)

    // 1. ACCOUNTS & CONTRACTS
    const web3 = new Web3(process.env.NODE_URI || 'http://127.0.0.1:8545') // to configure for rinkeby, see https://github.com/oceanprotocol/ocean.js/blob/efa3839d10befdbc35e16e61c8e9bf310039970b/src/utils/ConfigHelper.ts
    publisherAccount = web3.eth.accounts.privateKeyToAccount('0xef4b441145c1d0f3b4bc6d61d29f5c6e502359481152f869247c7a4244d45209')

    console.log(`Publisher account address: ${publisherAccount.address}`)
    
    const getAddresses = () => {
        const data = JSON.parse(
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          fs.readFileSync(
            process.env.ADDRESS_FILE ||
              `${homedir}/.ocean/ocean-contracts/artifacts/address.json`,
            'utf8'
          )
        )
        return data.development
    }
    addresses = getAddresses()

    // 2. PUBLISH DATA NFT & DATATOKEN WITH FIXED RATE EXCHANGE
    const factory = new NftFactory(addresses.ERC721Factory, web3)

    const nftParams = {
        name: FRE_NFT_NAME,
        symbol: FRE_NFT_SYMBOL,
        templateIndex: 1,
        tokenURI: '',
        transferable: true,
        owner: publisherAccount.address
    }
  
    const erc20Params = {
        templateIndex: 1,
        cap: '100000',
        feeAmount: '0',
        paymentCollector: ZERO_ADDRESS,
        feeToken: ZERO_ADDRESS,
        minter: publisherAccount.address,
        mpFeeAddress: ZERO_ADDRESS
    }

    const freParams = {
        fixedRateAddress: addresses.FixedPrice,
        baseTokenAddress: addresses.Ocean,
        owner: publisherAccount.address,
        marketFeeCollector: publisherAccount.address,
        baseTokenDecimals: 18,
        datatokenDecimals: 18,
        fixedRate: '1',
        marketFee: '0.001',
        allowedConsumer: ZERO_ADDRESS,
        withMint: false
    }

    const tx = await factory.createNftErc20WithFixedRate(
        publisherAccount.address,
        nftParams,
        erc20Params,
        freParams
    )
    
  
    freNftAddress = tx.events.NFTCreated.returnValues[0]
    freDatatokenAddress = tx.events.TokenCreated.returnValues[0]
    freAddress = tx.events.NewFixedRate.returnValues.exchangeContract
    freId = tx.events.NewFixedRate.returnValues.exchangeId

    console.log(`Fixed rate exchange NFT address: ${freNftAddress}`)
    console.log(`Fixed rate exchange Datatoken address: ${freDatatokenAddress}`)
    console.log(`Fixed rate exchange address: ${freAddress}`)
    console.log(`Fixed rate exchange Id: ${freId}`)

    // 2.5 Set metadata in the fixed rate exchange NFT
    const nft = new Nft(web3)

    DDO.chainId = await web3.eth.getChainId()
    DDO.id =
      'did:op:' +
      SHA256(web3.utils.toChecksumAddress(freNftAddress) + DDO.chainId.toString(10))
    DDO.nftAddress = freNftAddress

    ASSET_URL.datatokenAddress = freDatatokenAddress
    ASSET_URL.nftAddress = freNftAddress
    const encryptedFiles = await ProviderInstance.encrypt(ASSET_URL, providerUrl)
    DDO.services[0].files = await encryptedFiles
    DDO.services[0].datatokenAddress = freDatatokenAddress

    console.log(`DID: ${DDO.id}`)

    const providerResponse = await ProviderInstance.encrypt(DDO, providerUrl)
    const encryptedDDO = await providerResponse
    const metadataHash = getHash(JSON.stringify(DDO))
    await nft.setMetadata(
      freNftAddress,
      publisherAccount.address,
      0,
      providerUrl,
      '',
      '0x2',
      encryptedDDO,
      '0x' + metadataHash
    )

    const fixedRate = new FixedRateExchange(web3, freAddress)
    const oceanAmount = await (
      await fixedRate.calcBaseInGivenOutDT(freId, '1')
    ).baseTokenAmount

    console.log(`Price of 1 ${FRE_NFT_SYMBOL} is ${oceanAmount} OCEAN`)

      
}

publish()