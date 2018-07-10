var Zephyr = artifacts.require("./Zephyr.sol");
var ZephyrToken = artifacts.require("./ZephyrToken.sol");

contract('ZephyrNetworkSetup', function(accounts){

    let zephyr;
    let zephyrToken;

    it('deploys', async () => {
        zephyr = await Zephyr.deployed();
        zephyrToken = await ZephyrToken.deployed();

        console.log("Zephyr contract deployed on: ", zephyr.address);
        console.log("Zephyr token contract deployed on: ", zephyrToken.address);
    });
    
    it('add new zephyr token', async () => {
        const symbol = await zephyrToken.symbol();
        await zephyr.addToken(symbol, zephyrToken.address, {gasPrice: "70000000000"});
        const hasToken = await zephyr.hasToken(zephyrToken.address, {from: accounts[0]});
        assert.equal(hasToken, true);
    });
});