pragma solidity ^0.4.23;

import { administrated } from "./administrated.sol";
import { Erc20Token } from "./Erc20Token.sol";

contract Zephyr is administrated{

    struct Token {
        address contractAddress;
        string symbolName;

        mapping(uint => OrderBook) buyOrderBook;
        uint currentBuyPrice;
        uint lowestBuyPrice;
        uint buyOrderBookLength;

        mapping(uint => OrderBook) sellOrderBook;
        uint currentSellPrice;
        uint highestSellPrice;
        uint sellOrderBookLength;
    }

    struct OrderBook {
        uint higherPrice;
        uint lowerPrice;

        mapping(uint => Offer) offers;
        uint offers_key;
        uint offers_length;
    }

    struct Offer {
        uint amount;
        address who;
    }

    mapping(address => Token) tokens;

    mapping(address => mapping(address => uint)) tokenBalanceForAddress;
    mapping(address => uint) etherBalanceForAddress;

    event Deposit(address indexed tokenAddress, address indexed fromAddress, uint amount);
    event Withdraw(address indexed tokenAddress, address indexed toAddress, uint amount);

    event NewBuyLimitOrder(address indexed tokenAddress, address indexed who, uint amount, uint priceInWei, uint offerKey);
    event BuyLimitOrderCancel(address indexed tokenAddress, address indexed who, uint amount, uint priceInWei, uint offerKey);
    event BuyLimitOrderFilled(address indexed tokenAddress, uint amount, uint priceInWei, uint timestamp, uint offerKey);

    event NewSellLimitOrder(address indexed tokenAddress, address indexed who, uint amount, uint priceInWei, uint offerKey);
    event SellLimitOrderCancel(address indexed tokenAddress, address indexed who, uint amount, uint priceInWei, uint offerKey);
    event SellLimitOrderFilled(address indexed tokenAddress, uint amount, uint priceInWei, uint timestamp, uint offerKey);

    function addToken(string symbol, address contractAddress) public onlyAdmin {
        require(!hasToken(contractAddress));

        tokens[contractAddress].symbolName = symbol;
        tokens[contractAddress].contractAddress = contractAddress;
    }

    function hasToken(address contractAddress) public view returns (bool){
        Token storage token = tokens[contractAddress];
        if(token.contractAddress == address(0)){
            return false;
        }
        return true;
    }

    function depositEther() public payable{
        require(etherBalanceForAddress[msg.sender] + msg.value > etherBalanceForAddress[msg.sender]);
        
        etherBalanceForAddress[msg.sender] += msg.value;
        
        emit Deposit(address(this), msg.sender, msg.value);
    }
    
    function withdrawEther(uint amountInWei) public {
        require(etherBalanceForAddress[msg.sender] >= amountInWei);
        require(etherBalanceForAddress[msg.sender] - amountInWei <= etherBalanceForAddress[msg.sender]);

        etherBalanceForAddress[msg.sender] -= amountInWei;
        msg.sender.transfer(amountInWei);

        emit Withdraw(address(this), msg.sender, amountInWei);
    }

    function getEtherBalanceInWei() public view returns (uint){
        return etherBalanceForAddress[msg.sender];
    }

    function depositToken(address contractAddress, uint amount) public {
        require(tokens[contractAddress].contractAddress != address(0));
        require(tokenBalanceForAddress[msg.sender][contractAddress] + amount >= tokenBalanceForAddress[msg.sender][contractAddress]);

        Erc20Token tokenContract = Erc20Token(contractAddress);
        
        bool isTransferSuccess = tokenContract.transferFrom(msg.sender, address(this), amount);
        require(isTransferSuccess);

        tokenBalanceForAddress[msg.sender][contractAddress] += amount;

        emit Deposit(address(this), msg.sender, amount);
    }

    function withdrawTokens(address contractAddress, uint amount) public {
        Token storage token = getTokenSafe(contractAddress);
        require(tokenBalanceForAddress[msg.sender][contractAddress] >= amount);
        require(tokenBalanceForAddress[msg.sender][contractAddress] - amount <= tokenBalanceForAddress[msg.sender][contractAddress]);
        
        Erc20Token tokenContract = Erc20Token(token.contractAddress);

        bool isTransferSuccess = tokenContract.transfer(msg.sender, amount);
        require(isTransferSuccess);

        tokenBalanceForAddress[msg.sender][contractAddress] -= amount;
        emit Withdraw(token.contractAddress, msg.sender, amount);
    }

    function getTokenBalance(address contractAddress) public view returns (uint){
        return tokenBalanceForAddress[msg.sender][contractAddress];
    }

    function buyToken(address contractAddress, uint amount, uint priceInWei) public {
        Token storage token = getTokenSafe(contractAddress);

        if(token.sellOrderBookLength == 0 || token.currentSellPrice > priceInWei){
            uint totalPriceInWei = amount * priceInWei;
            
            require(totalPriceInWei >= amount);
            require(totalPriceInWei >= priceInWei);
            require(etherBalanceForAddress[msg.sender] >= totalPriceInWei);
            require(etherBalanceForAddress[msg.sender] - totalPriceInWei >= 0);

            etherBalanceForAddress[msg.sender] -= totalPriceInWei;
            addBuyLimitOrder(token, priceInWei, amount, msg.sender);
            emit NewBuyLimitOrder(token.contractAddress, msg.sender, amount, priceInWei, token.buyOrderBook[priceInWei].offers_length);
        }else {
            uint amountNecessary = addBuyMarketOrder(token, priceInWei, amount, msg.sender);
            if (amountNecessary > 0) {
                buyToken(token.contractAddress, priceInWei, amountNecessary);
            }
        }
    }
    
    function sellToken(address contractAddress, uint amount, uint priceInWei) public {
        Token storage token = getTokenSafe(contractAddress);
        
        if(token.buyOrderBookLength == 0 || token.currentBuyPrice < priceInWei){
            uint totalPriceInWei = amount * priceInWei;

            require(totalPriceInWei >= amount);
            require(totalPriceInWei >= priceInWei);
            require(tokenBalanceForAddress[msg.sender][contractAddress] >= amount);
            require(tokenBalanceForAddress[msg.sender][contractAddress] - amount <= tokenBalanceForAddress[msg.sender][contractAddress]);
            require(etherBalanceForAddress[msg.sender] + totalPriceInWei > etherBalanceForAddress[msg.sender]);

            tokenBalanceForAddress[msg.sender][contractAddress] -= amount;

            addSellLimitOrder(token, priceInWei, amount, msg.sender);

            emit NewSellLimitOrder(token.contractAddress, msg.sender, amount, priceInWei, token.sellOrderBook[priceInWei].offers_length);
        }else{
            uint amountNecessary = addSellMarketOrder(token, priceInWei, amount, msg.sender);
            if(amountNecessary > 0){
                sellToken(token.contractAddress, amountNecessary, priceInWei);
            }
        }
    }

    function getBuyOrderBook(address contractAddress) public view returns (uint[], uint[]){
        Token storage token = getTokenSafe(contractAddress);

        uint[] memory buyPrices = new uint[](token.buyOrderBookLength);
        uint[] memory buyVolumes = new uint[](token.buyOrderBookLength);

        uint counter = 0;
        uint price = token.lowestBuyPrice;

        if (token.currentBuyPrice > 0) {
            while (price <= token.currentBuyPrice) {

                uint volumeAtPrice = 0;
                uint offers_key = 0;

                offers_key = token.buyOrderBook[price].offers_key;
                while (offers_key <= token.buyOrderBook[price].offers_length) {
                    volumeAtPrice += token.buyOrderBook[price].offers[offers_key].amount;
                    offers_key++;
                }

                if(volumeAtPrice > 0){
                    buyPrices[counter] = price;
                    buyVolumes[counter] = volumeAtPrice;
                }

                if (price == token.buyOrderBook[price].higherPrice) {
                    break;
                }
                else {
                    price = token.buyOrderBook[price].higherPrice;
                }
                counter++;
            }
        }

        return (buyPrices, buyVolumes);
    }

    function getSellOrderBook(address contractAddress) public view returns (uint[], uint[]){
        Token storage token = getTokenSafe(contractAddress);

        uint[] memory sellPrices = new uint[](token.sellOrderBookLength);
        uint[] memory sellVolumes = new uint[](token.sellOrderBookLength);

        uint counter = 0;
        uint price = token.currentSellPrice;

        if (token.currentSellPrice > 0) {
            while (price <= token.highestSellPrice) {

                uint volumeAtPrice = 0;
                uint offers_key = 0;

                offers_key = token.sellOrderBook[price].offers_key;
                while (offers_key <= token.sellOrderBook[price].offers_length) {
                    volumeAtPrice += token.sellOrderBook[price].offers[offers_key].amount;
                    offers_key++;
                }

                if(volumeAtPrice > 0){
                    sellVolumes[counter] = volumeAtPrice;
                    sellPrices[counter] = price;
                }

                if (token.sellOrderBook[price].higherPrice == 0) {
                    break;
                }
                else {
                    price = token.sellOrderBook[price].higherPrice;
                }
                counter++;
            }
        }

        return (sellPrices, sellVolumes);
    }

    function cancelBuyLimitOrder(address contractAddress, uint priceInWei, uint offerKey) public {
        Token storage token = getTokenSafe(contractAddress);

        require(token.buyOrderBook[priceInWei].offers[offerKey].who == msg.sender);
        uint etherToRefund = token.buyOrderBook[priceInWei].offers[offerKey].amount * priceInWei;
        require(etherBalanceForAddress[msg.sender] + etherToRefund >= etherBalanceForAddress[msg.sender]);

        uint amountToCancel = token.buyOrderBook[priceInWei].offers[offerKey].amount;

        etherBalanceForAddress[msg.sender] += etherToRefund;
        token.buyOrderBook[priceInWei].offers[offerKey].amount = 0;

        emit BuyLimitOrderCancel(contractAddress, msg.sender, amountToCancel, priceInWei, offerKey);
    }

    function cancelSellLimitOrder(address contractAddress, uint priceInWei, uint offerKey) public {
        Token storage token = getTokenSafe(contractAddress);

        require(token.sellOrderBook[priceInWei].offers[offerKey].who == msg.sender);

        uint tokensAmount = token.sellOrderBook[priceInWei].offers[offerKey].amount;
        require(tokenBalanceForAddress[msg.sender][contractAddress] + tokensAmount >= tokenBalanceForAddress[msg.sender][contractAddress]);

        uint amountToCancel = token.sellOrderBook[priceInWei].offers[offerKey].amount;

        tokenBalanceForAddress[msg.sender][contractAddress] += tokensAmount;
        token.sellOrderBook[priceInWei].offers[offerKey].amount = 0;
        
        emit SellLimitOrderCancel(contractAddress, msg.sender, amountToCancel, priceInWei, offerKey);
    }

    function addBuyLimitOrder(Token storage token, uint priceInWei, uint amount, address buyer) internal {

        token.buyOrderBook[priceInWei].offers_length ++;
        token.buyOrderBook[priceInWei].offers[token.buyOrderBook[priceInWei].offers_length] = Offer({
            amount: amount,
            who: buyer
        });

        if(token.buyOrderBook[priceInWei].offers_length == 1){
            token.buyOrderBook[priceInWei].offers_key = 1;
            token.buyOrderBookLength++;

            uint currentBuyPrice = token.currentBuyPrice;
            uint lowestBuyPrice = token.lowestBuyPrice;

            if(lowestBuyPrice == 0 || token.lowestBuyPrice > priceInWei){
                if(currentBuyPrice == 0){
                    token.currentBuyPrice = priceInWei;
                    token.buyOrderBook[priceInWei].higherPrice = priceInWei;
                    token.buyOrderBook[priceInWei].lowerPrice = 0;
                } else{
                    token.buyOrderBook[lowestBuyPrice].lowerPrice = priceInWei;
                    token.buyOrderBook[priceInWei].higherPrice = lowestBuyPrice;
                    token.buyOrderBook[priceInWei].lowerPrice = 0;
                }

                token.lowestBuyPrice = priceInWei;
            } else if(currentBuyPrice < priceInWei){
                token.buyOrderBook[currentBuyPrice].higherPrice = priceInWei;
                token.buyOrderBook[priceInWei].higherPrice = priceInWei;
                token.buyOrderBook[priceInWei].lowerPrice = currentBuyPrice;
                token.currentBuyPrice = priceInWei;
            }else{

                uint buyPrice = token.currentBuyPrice;
                bool found = false;

                while(buyPrice > 0 && !found){
                    if(buyPrice<priceInWei && token.buyOrderBook[buyPrice].higherPrice > priceInWei){
                        token.buyOrderBook[priceInWei].lowerPrice = buyPrice;
                        token.buyOrderBook[priceInWei].higherPrice = token.buyOrderBook[buyPrice].higherPrice;
                        token.buyOrderBook[token.buyOrderBook[buyPrice].higherPrice].lowerPrice = priceInWei;
                        token.buyOrderBook[buyPrice].higherPrice = priceInWei;
                        found = true;
                    }
                    buyPrice = token.buyOrderBook[buyPrice].lowerPrice;
                }
            }
        }
    }
    function addBuyMarketOrder(Token storage token, uint priceInWei, uint amount, address buyer) internal returns (uint){
        uint total_amount_ether_available = 0;
        uint whilePrice = token.currentSellPrice;
        uint amountNecessary = amount;
        uint offers_key;
        uint total_amount_ether_necessary = 0;

        while (whilePrice <= priceInWei && amountNecessary > 0) {
            offers_key = token.sellOrderBook[whilePrice].offers_key;
            while (offers_key <= token.sellOrderBook[whilePrice].offers_length && amountNecessary > 0) {
                uint volumeAtPriceFromAddress = token.sellOrderBook[whilePrice].offers[offers_key].amount;

                if (volumeAtPriceFromAddress <= amountNecessary) {
                    total_amount_ether_available = volumeAtPriceFromAddress * whilePrice;

                    require(etherBalanceForAddress[buyer] >= total_amount_ether_available);
                    require(etherBalanceForAddress[buyer] - total_amount_ether_available <= etherBalanceForAddress[buyer]);
                    
                    etherBalanceForAddress[buyer] -= total_amount_ether_available;

                    require(tokenBalanceForAddress[buyer][token.contractAddress] + volumeAtPriceFromAddress >= tokenBalanceForAddress[buyer][token.contractAddress]);
                    require(etherBalanceForAddress[token.sellOrderBook[whilePrice].offers[offers_key].who] + total_amount_ether_available >= etherBalanceForAddress[token.sellOrderBook[whilePrice].offers[offers_key].who]);
                    
                    tokenBalanceForAddress[buyer][token.contractAddress] += volumeAtPriceFromAddress;
                    token.sellOrderBook[whilePrice].offers[offers_key].amount = 0;
                    etherBalanceForAddress[token.sellOrderBook[whilePrice].offers[offers_key].who] += total_amount_ether_available;
                    token.sellOrderBook[whilePrice].offers_key++;

                    emit SellLimitOrderFilled(token.contractAddress, volumeAtPriceFromAddress, whilePrice, block.timestamp, offers_key);

                    amountNecessary -= volumeAtPriceFromAddress;
                }
                else {
                    require(token.sellOrderBook[whilePrice].offers[offers_key].amount > amountNecessary);

                    total_amount_ether_necessary = amountNecessary * whilePrice;
                    require(etherBalanceForAddress[buyer] - total_amount_ether_necessary <= etherBalanceForAddress[buyer]);

                    etherBalanceForAddress[buyer] -= total_amount_ether_necessary;

                    require(etherBalanceForAddress[token.sellOrderBook[whilePrice].offers[offers_key].who] + total_amount_ether_necessary >= etherBalanceForAddress[token.sellOrderBook[whilePrice].offers[offers_key].who]);
                    
                    token.sellOrderBook[whilePrice].offers[offers_key].amount -= amountNecessary;
                    etherBalanceForAddress[token.sellOrderBook[whilePrice].offers[offers_key].who] += total_amount_ether_necessary;
                    tokenBalanceForAddress[buyer][token.contractAddress] += amountNecessary;

                    emit SellLimitOrderFilled(token.contractAddress, amountNecessary, whilePrice, block.timestamp, offers_key);

                    amountNecessary = 0;
                }

                if (offers_key == token.sellOrderBook[whilePrice].offers_length &&
                    token.sellOrderBook[whilePrice].offers[offers_key].amount == 0
                ) {

                    token.sellOrderBookLength--;
                    if (whilePrice == token.sellOrderBook[whilePrice].higherPrice || token.buyOrderBook[whilePrice].higherPrice == 0) {
                        token.currentSellPrice = 0;
                    }
                    else {
                        token.currentSellPrice = token.sellOrderBook[whilePrice].higherPrice;
                        token.sellOrderBook[token.buyOrderBook[whilePrice].higherPrice].lowerPrice = 0;
                    }
                }
                offers_key++;
            }

            whilePrice = token.currentSellPrice;
        }

        return amountNecessary;
    }
    function addSellLimitOrder(Token storage token, uint priceInWei, uint amount, address seller) internal {

        token.sellOrderBook[priceInWei].offers_length ++;
        token.sellOrderBook[priceInWei].offers[token.sellOrderBook[priceInWei].offers_length] = Offer({
            amount: amount,
            who: seller
        });

        if(token.sellOrderBook[priceInWei].offers_length == 1){
            token.sellOrderBook[priceInWei].offers_key = 1;
            token.sellOrderBookLength++;

            uint currentSellPrice = token.currentSellPrice;
            uint highestSellPrice = token.highestSellPrice;

            if(highestSellPrice == 0 || highestSellPrice < priceInWei){
                if(currentSellPrice == 0){
                    token.currentSellPrice = priceInWei;
                    token.sellOrderBook[priceInWei].higherPrice = 0;
                    token.sellOrderBook[priceInWei].lowerPrice = 0;
                } else{
                    token.sellOrderBook[highestSellPrice].higherPrice = priceInWei;
                    token.sellOrderBook[priceInWei].lowerPrice = highestSellPrice;
                    token.sellOrderBook[priceInWei].higherPrice = 0;
                }

                token.highestSellPrice = priceInWei;
            } else if(currentSellPrice > priceInWei){
                token.sellOrderBook[currentSellPrice].lowerPrice = priceInWei;
                token.sellOrderBook[priceInWei].higherPrice = currentSellPrice;
                token.sellOrderBook[priceInWei].lowerPrice = 0;
                token.currentSellPrice = priceInWei;
            }else{

                uint sellPrice = token.currentSellPrice;
                bool found = false;

                while(sellPrice > 0 && !found){
                    if(sellPrice<priceInWei && token.sellOrderBook[sellPrice].higherPrice > priceInWei){
                        token.sellOrderBook[priceInWei].lowerPrice = sellPrice;
                        token.sellOrderBook[priceInWei].higherPrice = token.sellOrderBook[sellPrice].higherPrice;
                        token.sellOrderBook[token.sellOrderBook[sellPrice].higherPrice].lowerPrice = priceInWei;
                        token.sellOrderBook[sellPrice].higherPrice = priceInWei;
                        found = true;
                    }
                    sellPrice = token.sellOrderBook[sellPrice].higherPrice;
                }
            }
        }
    }
    function addSellMarketOrder(Token storage token, uint priceInWei, uint amount, address seller) internal returns(uint){
        uint whilePrice = token.currentBuyPrice;
        uint amountNecessary = amount;
        uint total_amount_ether_available = 0;
        uint total_amount_ether_necessary = 0;
        uint offers_key;

        while (whilePrice >= priceInWei && amountNecessary > 0) {
            offers_key = token.buyOrderBook[whilePrice].offers_key;
            while (offers_key <= token.buyOrderBook[whilePrice].offers_length && amountNecessary > 0) {
                uint volumeAtPriceFromAddress = token.buyOrderBook[whilePrice].offers[offers_key].amount;

                if (volumeAtPriceFromAddress <= amountNecessary) {
                    total_amount_ether_available = volumeAtPriceFromAddress * whilePrice;

                    require(tokenBalanceForAddress[seller][token.contractAddress] >= volumeAtPriceFromAddress);
                    tokenBalanceForAddress[seller][token.contractAddress] -= volumeAtPriceFromAddress;

                    require(tokenBalanceForAddress[seller][token.contractAddress] - volumeAtPriceFromAddress >= 0);
                    require(tokenBalanceForAddress[token.buyOrderBook[whilePrice].offers[offers_key].who][token.contractAddress] + volumeAtPriceFromAddress >= tokenBalanceForAddress[token.buyOrderBook[whilePrice].offers[offers_key].who][token.contractAddress]);
                    require(etherBalanceForAddress[seller] + total_amount_ether_available >= etherBalanceForAddress[seller]);

                    tokenBalanceForAddress[token.buyOrderBook[whilePrice].offers[offers_key].who][token.contractAddress] += volumeAtPriceFromAddress;
                    tokens[token.contractAddress].buyOrderBook[whilePrice].offers[offers_key].amount = 0;
                    etherBalanceForAddress[seller] += total_amount_ether_available;
                    token.buyOrderBook[whilePrice].offers_key++;
                
                    emit BuyLimitOrderFilled(token.contractAddress, volumeAtPriceFromAddress, whilePrice, block.timestamp, offers_key);
                    
                    amountNecessary -= volumeAtPriceFromAddress;
                }
                else {
                    require(volumeAtPriceFromAddress - amountNecessary > 0);

                    total_amount_ether_necessary = amountNecessary * whilePrice;

                    require(tokenBalanceForAddress[seller][token.contractAddress] >= amountNecessary);
                    tokenBalanceForAddress[seller][token.contractAddress] -= amountNecessary;

                    require(tokenBalanceForAddress[seller][token.contractAddress] >= amountNecessary);
                    require(etherBalanceForAddress[seller] + total_amount_ether_necessary >= etherBalanceForAddress[msg.sender]);
                    require(tokenBalanceForAddress[token.buyOrderBook[whilePrice].offers[offers_key].who][token.contractAddress] + amountNecessary >= tokenBalanceForAddress[token.buyOrderBook[whilePrice].offers[offers_key].who][token.contractAddress]);

                    token.buyOrderBook[whilePrice].offers[offers_key].amount -= amountNecessary;
                    etherBalanceForAddress[seller] += total_amount_ether_necessary;
                    tokenBalanceForAddress[token.buyOrderBook[whilePrice].offers[offers_key].who][token.contractAddress] += amountNecessary;

                    emit BuyLimitOrderFilled(token.contractAddress, amountNecessary, whilePrice, block.timestamp, offers_key);

                    amountNecessary = 0;
                }

                if (offers_key == token.buyOrderBook[whilePrice].offers_length &&
                    token.buyOrderBook[whilePrice].offers[offers_key].amount == 0
                ) {
                    token.buyOrderBookLength--;

                    if (whilePrice == token.buyOrderBook[whilePrice].lowerPrice || token.buyOrderBook[whilePrice].lowerPrice == 0) {
                        token.currentBuyPrice = 0;
                    }
                    else {
                        token.currentBuyPrice = token.buyOrderBook[whilePrice].lowerPrice;
                        token.buyOrderBook[token.buyOrderBook[whilePrice].lowerPrice].higherPrice = token.currentBuyPrice;
                    }
                }
                offers_key++;
            }

            whilePrice = token.currentBuyPrice;
        }

        return amountNecessary;
    }

    function getTokenSafe(address contractAddress) internal view returns (Token storage){
        Token storage token = tokens[contractAddress];
        require(token.contractAddress != address(0));
        return token;
    }
}