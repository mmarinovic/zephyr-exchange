import React, { Component } from 'react';
import web3 from '../web3';
import zephyr from '../zephyrContract';

class OrderBook extends Component{

    constructor(props){
        super(props);

        const isAsk = props.type === 'Ask';
        this.state = {
            isAsk: isAsk,
            title: isAsk ? 'Asks': 'Bids',
            selectedToken: {},
            orderBook: []
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.selectedToken.contractAddress !== prevProps.selectedToken.contractAddress) {
            this.setState({ selectedToken: this.props.selectedToken});
            this._loadOrderBook(this.props.selectedToken.contractAddress);
        }
    }
    
    render(){
        return (
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">{this.state.title}</h5>
                    <div className="card-text">
                        <table className="table">
                            <tbody>
                                <tr>
                                    <th>Price</th>
                                    <th>Amount</th>
                                    <th>Total</th>
                                </tr>
                                { this.state.orderBook.map((entry) => (
                                <tr key={entry.price}>
                                    <td>{entry.price}</td>
                                    <td>{entry.amount} </td>
                                    <td>{entry.total}</td>
                                </tr>)) }   
                            </tbody>
                        </table>
                        
                        {!this.state.orderBook.length? <div className="text-center">Empty</div>: ""}
                    </div>
                </div>
            </div>
        );
    }

    _loadOrderBook = (contractAddress) => {
        const orderBookMethod = this.state.isAsk
         ? zephyr.methods.getBuyOrderBook(contractAddress)
         : zephyr.methods.getSellOrderBook(contractAddress);

         orderBookMethod.call()
            .then((book) => {
                var prices = book [0];
                var amounts = book [1];
                var formattedOrderBook = [];

                prices.map((price, index) => {
                    let amount = amounts[index];
                    let total = price * amount;
                    if(price > 0){
                        formattedOrderBook.push({
                            price: web3.utils.fromWei(price.toString()),
                            amount: amount,
                            total: web3.utils.fromWei(total.toString())
                        });
                    }
                    this.setState({ orderBook: formattedOrderBook });
                });
            });
    }
}

export default OrderBook;