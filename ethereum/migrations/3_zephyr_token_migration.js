var ZephyrToken = artifacts.require("./ZephyrToken.sol");

module.exports = function(deployer) {
  deployer.deploy(ZephyrToken);
};
