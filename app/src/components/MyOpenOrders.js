import React, { Component } from 'react';
import web3 from '../web3';
import zephyr from '../zephyrContract';
import _ from 'underscore';
import swal from 'sweetalert';

class MyOpenOrders extends Component {

    state = {
        selectedToken: {},
        openOrders: []
    }

    componentDidUpdate(prevProps) {
        if (this.props.selectedToken.contractAddress !== prevProps.selectedToken.contractAddress) {
            this.setState({ selectedToken: this.props.selectedToken});
            this._loadOpenOrders(this.props.selectedToken.contractAddress);
        }
    }
    
    render(){
        return (
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title"> My open orders</h5>
                    <div className="card-text">
                        <table className="table">
                            <tbody>
                                <tr>
                                    <th>Price</th>
                                    <th>Amount</th>
                                    <th></th>
                                </tr>
                                { this.state.openOrders.map((order) => (
                                <tr key={order.priceInEth} className={order.isSellOrder ? "text-danger": order.isBuyOrder? "text-success" : ""}>
                                    <td>{order.priceInEth}</td>
                                    <td>{order.amount} </td>
                                    <td><button className="btn btn-danger" onClick={() => {this.cancel(order)}}>Cancel</button></td>
                                </tr>)) }   
                            </tbody>
                        </table>
                        
                        {!this.state.openOrders.length? <div className="text-center">No open orders</div>: ""}
                    </div>
                </div>
            </div>
        );
    }

    cancel = (order) => {
        if(order.isBuyOrder){
            zephyr.methods.cancelBuyLimitOrder(this.state.selectedToken.contractAddress, order.priceInWei, order.offerKey)
                .send({from: this.props.currentAccount})
                .then((tx) => swal("Cancel transaction created!", "Transaction id is " + tx.transactionHash, "success"));
        }else if(order.isSellOrder){
            zephyr.methods.cancelSellLimitOrder(this.state.selectedToken.contractAddress, order.priceInWei, order.offerKey)
                .send({from: this.props.currentAccount})
                .then((tx) => swal("Cancel transaction created!", "Transaction id is " + tx.transactionHash, "success"));
        }
    }

    _loadOpenOrders = (tokenContractAddress) => {
        web3.eth.getBlockNumber((error, currentBlockNumber) => {
            const blocksMinedPerDay = 6000;
            const blockFromAbout24hAgo = currentBlockNumber - blocksMinedPerDay;

            const newBuyLimitOrderPromise = zephyr.getPastEvents("NewBuyLimitOrder", { fromBlock: blockFromAbout24hAgo, filter: { tokenAddress: tokenContractAddress, who: this.props.currentAccount }});
            const filledBuyLimitOrderPromise = zephyr.getPastEvents("BuyLimitOrderFilled", { fromBlock: blockFromAbout24hAgo, filter: { tokenAddress: tokenContractAddress }});
            const canceledBuyLimitOrderPromise = zephyr.getPastEvents("BuyLimitOrderCancel", { fromBlock: blockFromAbout24hAgo, filter: { tokenAddress: tokenContractAddress, who: this.props.currentAccount }});
            
            const newSellLimitOrderPromise = zephyr.getPastEvents("NewSellLimitOrder", { fromBlock: blockFromAbout24hAgo, filter: { tokenAddress: tokenContractAddress, who: this.props.currentAccount }});
            const filledSellLimitOrderPromise = zephyr.getPastEvents("SellLimitOrderFilled", { fromBlock: blockFromAbout24hAgo, filter: { tokenAddress: tokenContractAddress }});
            const canceledSellLimitOrderPromise = zephyr.getPastEvents("SellLimitOrderCancel", { fromBlock: blockFromAbout24hAgo, filter: { tokenAddress: tokenContractAddress, who: this.props.currentAccount }});

            let getFormattedData = (event) => {
                let data = event.returnValues;
                data.priceInEth = web3.utils.fromWei(data.priceInWei.toString());
                return data;
            };

            Promise.all([newBuyLimitOrderPromise, 
                filledBuyLimitOrderPromise, 
                canceledBuyLimitOrderPromise,
                newSellLimitOrderPromise,
                filledSellLimitOrderPromise,
                canceledSellLimitOrderPromise]).then((values) =>{
                
                let [newBuyLimitOrders, filledBuyLimitOrders, canceledBuyLimitOrders, newSellLimitOrders, filledSellLimitOrders, canceledSellLimitOrders] = values;
        
                let filledBuyOfferKeys = filledBuyLimitOrders.map((o) => o.returnValues.offerKey);
                let canceledBuyOfferKeys = canceledBuyLimitOrders.map((o) => o.returnValues.offerKey);

                let filledSellOfferKeys = filledSellLimitOrders.map((o) => o.returnValues.offerKey);
                let canceledSellOfferKeys = canceledSellLimitOrders.map((o) => o.returnValues.offerKey);

                const buyOpenOrders = _.filter(newBuyLimitOrders.map(e => {
                    let data = getFormattedData(e);
                    data.isBuyOrder = true;
                    return data;
                }), (o) => !_.contains(filledBuyOfferKeys, o.offerKey) && !_.contains(canceledBuyOfferKeys, o.offerKey));

                const sellOpenOrders = _.filter(newSellLimitOrders.map(e => {
                    let data = getFormattedData(e);
                    data.isSellOrder = true;
                    return data;
                }), (o) => !_.contains(filledSellOfferKeys, o.offerKey) && !_.contains(canceledSellOfferKeys, o.offerKey));

                this.setState({openOrders: buyOpenOrders.concat(sellOpenOrders)});
              });
        });
    }
}

export default MyOpenOrders;