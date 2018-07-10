import React, { Component } from 'react';
import zephyr from '../zephyrContract';
import web3 from 'web3';
import swal from 'sweetalert';
import Erc20Token from '../erc20Contract';

class Deposit extends Component{

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
                        <span>Deposit</span>
                        <ul className="nav nav-tabs" id="myTab" role="tablist">
                            <li className="nav-item">
                                <a className={this.state.type === this.types.ether ? 'active nav-link' : 'nav-link'} onClick={() => this.switchDepositType(this.types.ether)}>ETH</a>
                            </li>
                            <li className="nav-item">
                                <a className={this.state.type === this.types.token ? 'active nav-link' : 'nav-link'} onClick={() => this.switchDepositType(this.types.token)}>{this.state.selectedToken.symbol}</a>
                            </li>
                        </ul>
                    </h5>
                    <div className="card-text">
                        <div className="form-group">
                            <label> Amount </label>
                            <div className="input-group"> 
                                <input type="number" min="0" value={this.state.amount} placeholder="Amount" className="form-control" onChange={(e) => this.setState({amount: e.target.value})}/> 
                                <div className="input-group-append">
                                    <button onClick={this.setMaxAmount} className="btn btn-link">Max</button>
                                </div>
                            </div>
                        </div>
                        <button type="button" className="btn btn-primary" onClick={this.deposit}>Deposit</button>
                    </div>
                </div>
            </div>
        );
    }

    switchDepositType = (type) => {
        this.setState({ type, amount: ''});
    }

    setMaxAmount = () => {
        switch (this.state.type) {
            case this.types.ether:
                this.setState({amount: this.props.balances.etherInWallet * 0.99})
                break;
            case this.types.token:
                this.setState({amount: this.props.balances.tokenInWallet})
                break;
            default:
                break;
        }
    }

    deposit = () => {
        switch (this.state.type) {
            case this.types.ether:
                this._depositEther();
                break;
            case this.types.token:
               this._depositToken();
                break;
            default:
                break;
        }
    }

    _depositEther = () => {

        var isAmountValid = this.state.amount && Number(this.state.amount) <= Number(this.props.balances.etherInWallet);
        if(!isAmountValid){
            swal("Warning!", "Not enough tokens for this action", "warning");
            return;
        }

        zephyr.methods.depositEther().send({
            from: this.props.currentAccount,
            value: web3.utils.toWei(this.state.amount.toString())
        }).then(tx => {
            swal("Transaction created!", "Transaction id is " + tx.transactionHash, "success");
            this.props.onBalanceChange();
        });

        this.setState({amount: ''});
    }

    _depositToken = () => {

        var isAmountValid = this.state.amount && Number(this.state.amount) <= Number(this.props.balances.tokenInWallet)
        if(!isAmountValid){
            swal("Warning!", "Not enough tokens for this action", "warning");
            return;
        }

        const amount = this.state.amount;
        Erc20Token(this.state.selectedToken.contractAddress).methods.approve(zephyr.options.address, amount)
                .send({ from: this.props.currentAccount })
                .then(tx => {
                    zephyr.methods.depositToken(this.state.selectedToken.contractAddress, amount)
                    .send({ from: this.props.currentAccount })
                    .then(tx => {
                        swal("Transaction created!", "Transaction id is " + tx.transactionHash, "success");
                        this.props.onBalanceChange();
                    });
                });

        this.setState({amount: ''});
    }
}

export default Deposit;