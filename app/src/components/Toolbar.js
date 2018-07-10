import React, { Component } from 'react';
import web3 from '../web3';

class Toolbar extends Component{

    state = {
        networkType: '',
        selectedToken: {}
    }

    componentDidMount(){
        web3.eth.net.getNetworkType().then((networkType) => this.setState({ networkType }));
    }

    componentDidUpdate(prevProps){
        if(prevProps.selectedToken.contractAddress !== this.props.selectedToken.contractAddress ){
            this.setState({ selectedToken: this.props.selectedToken });
        }
    }
    
    render(){
        const tokenListItems = this.props.tokens.map((token) => {
            return (<li className="dropdown-item" key={token.contractAddress} onClick={() => this.selectToken(token)}>{token.symbol}/ETH</li>)
        });
        return (
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <a className="navbar-brand" href="/">Zephyr Exchange</a>
                    <ul className="navbar-nav mr-auto">
                        <li className="nav-item dropdown">
                            <a className="nav-link dropdown-toggle" data-toggle="dropdown" href="#" id="navbarDropdown" >
                                {this.props.selectedToken.symbol}/ETH
                            </a>
                            <ul className="dropdown-menu" id="navbarDropdown">
                                {tokenListItems}
                            </ul>
                        </li>
                    </ul>
                    <div>
                        <span>Account: {this.props.currentAccount} <span className="badge badge-primary">{this.props.balances.etherInWallet} ETH</span></span>
                        <br />
                        <span> Connection: {this.state.networkType} </span>
                    </div>
            </nav>
        );
    }

    selectToken = (token) => {
        this.setState({selectedToken : token});
        this.props.onTokenChange(token);
    }
}

export default Toolbar;