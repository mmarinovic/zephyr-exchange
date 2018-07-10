import React, { Component } from 'react';
import zephyr from '../zephyrContract';
import web3 from 'web3';
import swal from 'sweetalert';

class Withdraw extends Component{

    types = {
        ether: 1,
        token: 2
    }

    state = {
        type: this.types.ether,
        selectedToken: {},
        amount: ''
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
                    <h5 className="card-title">
                        <span>Withdraw</span>
                        <ul className="nav nav-tabs" id="myTab" role="tablist">
                            <li className="nav-item">
                                <a className={this.state.type === this.types.ether ? 'active nav-link' : 'nav-link'} onClick={() => this.switchWithdrawType(this.types.ether)}>ETH</a>
                            </li>
                            <li className="nav-item">
                                <a className={this.state.type === this.types.token ? 'active nav-link' : 'nav-link'} onClick={() => this.switchWithdrawType(this.types.token)}>{this.state.selectedToken.symbol}</a>
                            </li>
                        </ul>
                    </h5>
                    <div className="card-text">
                        <div className="form-group">
                            <div className="input-group"> 
                                <input type="number" min="0" value={this.state.amount} placeholder="Amount" className="form-control" onChange={(e) => this.setState({amount: e.target.value})}/> 
                                <div className="input-group-append">
                                    <button onClick={this.setMaxAmount} className="btn btn-link">Max</button>
                                </div>
                            </div>
                        </div>
                        <button type="button" className="btn btn-primary" onClick={this.withdraw}>Withdraw</button>
                    </div>
                </div>
            </div>
        );
    }

    switchWithdrawType = (type) => {
        this.setState({ type, amount: ''});
    }

    setMaxAmount = () => {
        switch (this.state.type) {
            case this.types.ether:
                this.setState({amount: this.props.balances.etherOnExchange * 0.99})
                break;
            case this.types.token:
                this.setState({amount: this.props.balances.tokenOnExchange})
                break;
            default:
                break;
        }
    }

    withdraw = () => {
        switch (this.state.type) {
            case this.types.ether:
                this._withdrawEther();
                break;
            case this.types.token:
               this._withdrawToken();
                break;
            default:
                break;
        }
    }

    _withdrawEther = () => {

        var isAmountValid = this.state.amount && Number(this.state.amount) <= Number(this.props.balances.etherOnExchange);
        if(!isAmountValid){
            swal("Warning!", "Not enough tokens for this action", "warning");
            return;
        }

        zephyr.methods.withdrawEther(web3.utils.toWei(this.state.amount.toString()))
            .send({ from: this.props.currentAccount })
            .then(tx => {
                swal("Transaction created!", "Transaction id is " + tx.transactionHash, "success");
                this.props.onBalanceChange();
            });

        this.setState({amount: ''});
    }

    _withdrawToken = () => {

        var isAmountValid = this.state.amount && Number(this.state.amount) <= Number(this.props.balances.tokenOnExchange);
        if(!isAmountValid){
            swal("Warning!", "Not enough tokens for this action", "warning");
            return;
        }

        zephyr.methods.withdrawTokens(this.state.selectedToken.contractAddress, this.state.amount)
            .send({  from: this.props.currentAccount})
            .then(tx => {
                swal("Transaction created!", "Transaction id is " + tx.transactionHash, "success");
                this.props.onBalanceChange();
            });

        this.setState({amount: ''});
    }
}

export default Withdraw;