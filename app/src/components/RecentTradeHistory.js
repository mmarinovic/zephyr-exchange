import React, { Component } from 'react';
import web3 from '../web3';
import zephyr from '../zephyrContract';

class RecentTradeHistory extends Component {

    state = {
        selectedToken: {},
        tradeHistory: []
    }

    componentDidUpdate(prevProps) {
        if (this.props.selectedToken.contractAddress !== prevProps.selectedToken.contractAddress) {
            this.setState({ selectedToken: this.props.selectedToken});
            this._loadTradeHistory(this.props.selectedToken.contractAddress);
        }
    }
    
    render(){
        return (
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title"> Trade History (24h)</h5>
                    <div className="card-text">
                        <table className="table">
                            <tbody>
                                <tr>
                                    <th>Price</th>
                                    <th>Amount</th>
                                    <th>Timestamp</th>
                                </tr>
                                { this.state.tradeHistory.map((entry) => (
                                <tr key={entry.priceInEth} className={entry.isSellEvent ? "text-danger": entry.isBuyEvent? "text-success" : ""}>
                                    <td>{entry.priceInEth}</td>
                                    <td>{entry.amount} </td>
                                    <td>{entry.timestamp}</td>
                                </tr>)) }   
                            </tbody>
                        </table>
                        
                        {!this.state.tradeHistory.length? <div className="text-center">No trades yet</div>: ""}
                    </div>
                </div>
            </div>
        );
    }

    _loadTradeHistory = (tokenContractAddress) => {
        web3.eth.getBlockNumber((error, currentBlockNumber) => {
            const blocksMinedPerDay = 6000;
            const blockFromAbout24hAgo = currentBlockNumber - blocksMinedPerDay;

            const buyLimitOrderFilledPromise = zephyr.getPastEvents("BuyLimitOrderFilled", { fromBlock: blockFromAbout24hAgo, filter: { tokenAddress: tokenContractAddress }});
            const sellLimitOrderFilledPromise = zephyr.getPastEvents("SellLimitOrderFilled", { fromBlock: blockFromAbout24hAgo, filter: { tokenAddress: tokenContractAddress }});

            let getFormattedData = (event) => {
                let data = event.returnValues;
                data.priceInEth = web3.utils.fromWei(data.priceInWei.toString());
                return data;
            };

            Promise.all([buyLimitOrderFilledPromise, sellLimitOrderFilledPromise]).then((values) =>{

                const buyEvents = values[0].map(e => {
                    let data = getFormattedData(e);
                    data.isBuyEvent = true;
                    return data;
                });

                const sellEvents = values[1].map(e => {
                    let data = getFormattedData(e);
                    data.isSellEvent = true;
                    return data;
                });

                this.setState({ tradeHistory: buyEvents.concat(sellEvents)});
              });
        });
    }
}

export default RecentTradeHistory;