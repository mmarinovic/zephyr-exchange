const HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(
          'attend twist rally finger fetch any cake kiss uncle monitor glimpse fruit',
          'https://rinkeby.infura.io/ZKxA2TsccPJIoWO5h7EO'
        )
      },
      network_id: '3',
    }
  }
};
