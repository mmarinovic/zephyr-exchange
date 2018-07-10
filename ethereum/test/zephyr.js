var Zephyr = artifacts.require("./Zephyr.sol");
var ZephyrToken = artifacts.require("./ZephyrToken.sol");

contract('Zephyr', function(accounts){

    const regularUser = accounts[1];

    let zephyr;
    let zephyrToken;

    calculateTransactionGasCost = (tx) => {
        let transaction = Zephyr.web3.eth.getTransactionReceipt(tx);
        return web3.eth.getTransaction(tx).gasPrice * transaction.gasUsed;
    }

    beforeEach(async () => {
        zephyr = await Zephyr.deployed();
        zephyrToken = await ZephyrToken.deployed();

        await zephyrToken.transfer(regularUser, 1000);
    });

    it('owner can add new token', async () => {
        const symbol = await zephyrToken.symbol();
        await zephyr.addToken(symbol, zephyrToken.address);
        const hasToken = await zephyr.hasToken(zephyrToken.address);
        assert.equal(hasToken, true);
    });

    it('not owner cant add new token', async () => {
        try{
            await zephyr.addToken(zephyrToken.address, { from : regularUser});
            assert.equal(false);
        }catch(e){}
    });

    it('can deposit ether', async () => {
        const amountToDepositInWei = Zephyr.web3._extend.utils.toWei("1");

        const deposit = await zephyr.depositEther({ value: amountToDepositInWei, from: regularUser });
        const balanceInWeiForUser = await zephyr.getEtherBalanceInWei({from: regularUser});

        assert.equal(balanceInWeiForUser, amountToDepositInWei);
        assert.equal(deposit.logs[0].event, "Deposit");
    });

    it('can withdraw ether', async () => {
        const amountToWithdrawInWei = Zephyr.web3._extend.utils.toWei("1");

        const currentBalance = await Zephyr.web3.eth.getBalance(regularUser);
        const withdrawal = await zephyr.withdrawEther(amountToWithdrawInWei, { from: regularUser });
        const newCurrentBalance = await Zephyr.web3.eth.getBalance(regularUser);
        const withdrawalGasCost = calculateTransactionGasCost(withdrawal.tx);

        assert.isAtLeast(currentBalance.toNumber(), newCurrentBalance.toNumber() - Number(amountToWithdrawInWei) + withdrawalGasCost);
        assert.equal(withdrawal.logs[0].event, "Withdraw");
    });

    it('can deposit zephyr token', async () => {
        const amount = 500;

        await zephyrToken.approve(zephyr.address, amount, { from: regularUser });
        const deposit = await zephyr.depositToken(zephyrToken.address, amount, { from: regularUser });
        const userbalanceOfTokensOnExchange = await zephyr.getTokenBalance(zephyrToken.address, { from: regularUser });

        assert.equal(userbalanceOfTokensOnExchange.toNumber(), amount);
        assert.equal(deposit.logs[0].event, "Deposit");
    });

    it('can withdraw zephyr token', async () => {
        const amount = 500;

        const currentUserTokenContractBalance = await zephyrToken.balanceOf(regularUser);
        const currentUserBalanceOnExchange = await zephyr.getTokenBalance(zephyrToken.address, { from: regularUser });

        const withdrawal = await zephyr.withdrawTokens(zephyrToken.address, amount, { from: regularUser });

        const newCurrentUserBalanceOnExchange = await zephyr.getTokenBalance(zephyrToken.address, { from: regularUser });
        const newCurrentUserTokenContractBalance = await zephyrToken.balanceOf(regularUser);

        assert.equal(currentUserBalanceOnExchange.toNumber() - amount, newCurrentUserBalanceOnExchange.toNumber());
        assert.equal(currentUserTokenContractBalance.toNumber() + amount, newCurrentUserTokenContractBalance.toNumber());
        assert.equal(withdrawal.logs[0].event, "Withdraw");
    });

    it('can add buy order to order book', async () => {
        const amount = 100;
        const priceInWei = Zephyr.web3._extend.utils.toWei("0.0001");
        const amountToDepositInWei = Zephyr.web3._extend.utils.toWei("1");

        await zephyr.depositEther({ value: amountToDepositInWei, from: regularUser });
        await zephyr.buyToken(zephyrToken.address, amount, priceInWei, { from: regularUser });

        const buyOrderBook = await zephyr.getBuyOrderBook(zephyrToken.address);
        
        let priceInBook = buyOrderBook[0][0].toNumber();
        let volumeInBook = buyOrderBook[1][0].toNumber();

        assert.equal(priceInBook, priceInWei);
        assert.equal(volumeInBook, amount);
    });

    it('can add sell order to order book', async () => {
        const amount = 200;
        const priceInWei = Zephyr.web3._extend.utils.toWei("0.0002");

        await zephyrToken.approve(zephyr.address, amount, { from: regularUser });
        await zephyr.depositToken(zephyrToken.address, amount, { from: regularUser });
        await zephyr.sellToken(zephyrToken.address, amount, priceInWei, { from: regularUser });

        const sellOrderBook = await zephyr.getSellOrderBook(zephyrToken.address);
        
        let priceInBook = sellOrderBook[0][0].toNumber();
        let volumeInBook = sellOrderBook[1][0].toNumber();

        assert.equal(priceInBook, priceInWei);
        assert.equal(volumeInBook, amount);
    });

    it('sell order matches order is buy order book', async () => {
        const amount = 100;
        const priceInWei = Zephyr.web3._extend.utils.toWei("0.0001");

        await zephyrToken.approve(zephyr.address, amount, { from: regularUser });
        await zephyr.depositToken(zephyrToken.address, amount, { from: regularUser });

        await zephyr.sellToken(zephyrToken.address, amount, priceInWei, { from: regularUser });

        const sellOrderBook = await zephyr.getSellOrderBook(zephyrToken.address);
       
        let priceInBook = sellOrderBook[0][0].toNumber();
        let volumeInBook = sellOrderBook[1][0].toNumber();

        assert.notEqual(priceInBook, priceInWei);
        assert.notEqual(volumeInBook, amount);
    });
});