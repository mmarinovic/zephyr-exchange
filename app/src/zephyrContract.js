import web3 from './web3';

const contractAddress = "0xde6479ae64e4825946472222d3e78e0447c21b1e";
const contractABI = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "newAdmin",
        "type": "address"
      }
    ],
    "name": "changeAdmin",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "fromAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Deposit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "toAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Withdraw",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "who",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "priceInWei",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "offerKey",
        "type": "uint256"
      }
    ],
    "name": "NewBuyLimitOrder",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "who",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "priceInWei",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "offerKey",
        "type": "uint256"
      }
    ],
    "name": "BuyLimitOrderCancel",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "priceInWei",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "offerKey",
        "type": "uint256"
      }
    ],
    "name": "BuyLimitOrderFilled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "who",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "priceInWei",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "offerKey",
        "type": "uint256"
      }
    ],
    "name": "NewSellLimitOrder",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "who",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "priceInWei",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "offerKey",
        "type": "uint256"
      }
    ],
    "name": "SellLimitOrderCancel",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "priceInWei",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "offerKey",
        "type": "uint256"
      }
    ],
    "name": "SellLimitOrderFilled",
    "type": "event"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "symbol",
        "type": "string"
      },
      {
        "name": "contractAddress",
        "type": "address"
      }
    ],
    "name": "addToken",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "contractAddress",
        "type": "address"
      }
    ],
    "name": "hasToken",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "depositEther",
    "outputs": [],
    "payable": true,
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "amountInWei",
        "type": "uint256"
      }
    ],
    "name": "withdrawEther",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "getEtherBalanceInWei",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "contractAddress",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "depositToken",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "contractAddress",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdrawTokens",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "contractAddress",
        "type": "address"
      }
    ],
    "name": "getTokenBalance",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "contractAddress",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      },
      {
        "name": "priceInWei",
        "type": "uint256"
      }
    ],
    "name": "buyToken",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "contractAddress",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      },
      {
        "name": "priceInWei",
        "type": "uint256"
      }
    ],
    "name": "sellToken",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "contractAddress",
        "type": "address"
      }
    ],
    "name": "getBuyOrderBook",
    "outputs": [
      {
        "name": "",
        "type": "uint256[]"
      },
      {
        "name": "",
        "type": "uint256[]"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "contractAddress",
        "type": "address"
      }
    ],
    "name": "getSellOrderBook",
    "outputs": [
      {
        "name": "",
        "type": "uint256[]"
      },
      {
        "name": "",
        "type": "uint256[]"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "contractAddress",
        "type": "address"
      },
      {
        "name": "priceInWei",
        "type": "uint256"
      },
      {
        "name": "offerKey",
        "type": "uint256"
      }
    ],
    "name": "cancelBuyLimitOrder",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "contractAddress",
        "type": "address"
      },
      {
        "name": "priceInWei",
        "type": "uint256"
      },
      {
        "name": "offerKey",
        "type": "uint256"
      }
    ],
    "name": "cancelSellLimitOrder",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const zephyr = new web3.eth.Contract(contractABI, contractAddress);

export default zephyr;