import React, { Component } from 'react';
import web3 from '../web3';
import zephyr from '../zephyrContract';
import swal from 'sweetalert';

class Buy extends Component{

    state = {
        amount: '',
        price: '',
        selectedToken: {}
    }

    componentDidUpdate(prevProps) {
        if (this.props.selectedToken.contractAddress !== prevProps.selectedToken.contractAddress) {
            this.setState({ selectedToken: this.props.selectedToken});
        }
    }
    
    render(){
        return (
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">Buy</h5>
                    <div className="card-text">
                        <div className="form-group">
                            <label>Amount</label>
                            <input value={this.state.amount} onChange={this.onAmountChanged} type="number" className="form-control" />
                        </div>
                        <div className="form-group">
                            <label>Price</label>
                            <input value={this.state.price} onChange={this.onPriceChanged} type="number" className="form-control" />
                            <small className="form-text text-muted">{this.props.balances.etherOnExchange} ETH available on exchange</small>
                        </div>
                        <div className="form-group">
                            <label>Total: {this.state.total} </label>
                        </div>
                        <button className="btn btn-success" onClick={this.buy}> Place Buy Order </button>
                    </div>
                </div>
            </div>
        );
    }

    onAmountChanged = (e) => {
        const total = this.state.price ? e.target.value * this.state.price : 0;
        this.setState({amount: e.target.value, total});
    }

    onPriceChanged = (e) => {
        const total = this.state.amount ? e.target.value * this.state.amount : 0;
        this.setState({price: e.target.value, total});
    }

    buy = () => {

        var isValid = (this.state.amount * this.state.price) <= this.props.balances.etherOnExchange;
        if(!isValid){
            swal("Warning!", "Not enough ether for this action", "warning");
            return;
        }

        zephyr.methods.buyToken(this.state.selectedToken.contractAddress, this.state.amount, web3.utils.toWei(this.state.price.toString()))
            .send({from: this.props.currentAccount})
            .then((tx) => {
                swal("Transaction created!", "Transaction id is " + tx.transactionHash, "success");
                this.props.onBuy();
            });

        this.setState({amount: '', price: '', total: ''});
    }
}

export default Buy;