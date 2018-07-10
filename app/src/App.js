import React, { Component } from 'react';
import axios from 'axios';
import web3 from './web3';
import _ from 'underscore';

import zephyr from './zephyrContract';
import Erc20Token from './erc20Contract';

import Toolbar from './components/Toolbar';
import Balances from './components/Balances';
import Deposit from './components/Deposit';
import Withdraw from './components/Withdraw';
import Buy from './components/Buy';
import Sell from './components/Sell';
import OrderBook from './components/OrderBook';
import RecentTradeHistory from './components/RecentTradeHistory';
import MyOpenOrders from './components/MyOpenOrders';

class App extends Component {

  state = {
    globalConfig: {tokens: []},
    selectedToken: {},
    currentAccount: '',
    balances: {
        etherOnExchange: 0,
        tokenOnExchange: 0,

        etherInWallet: 0,
        tokenInWallet: 0,
      }
  }

  componentDidMount(){
    const globalConfigPromise = axios.get(`/globalConfig.json`);

    web3.eth.getAccounts()
      .then((accounts) => {
        const currentAccount = accounts[0];
        this.setState({currentAccount})
        this._loadEtherBalances(currentAccount);
        return currentAccount;
      })
      .then((currentAccount) =>{
        globalConfigPromise.then(res => {
          this.setState({globalConfig: res.data});
          const selectedToken = _.findWhere(this.state.globalConfig.tokens, {contractAddress: this.state.globalConfig.defaultToken});
          this.setState({selectedToken});
          this._loadTokenBalances(selectedToken.contractAddress, currentAccount);
        });
      });
  }

  render() {
    return (
      <div className="App">
          <header className="App-header">
            <Toolbar currentAccount={this.state.currentAccount}
                     tokens={this.state.globalConfig.tokens} 
                     balances={this.state.balances}
                     selectedToken={this.state.selectedToken} 
                     onTokenChange={(token) => this.setState({selectedToken: token})}/>
          </header>
          <br/>
          <div className="row"> 
            <div className="col-md-3"> 
              <Balances balances={this.state.balances} 
                        selectedToken={this.state.selectedToken}/>
              <br/>

              <Deposit balances={this.state.balances} 
                      onBalanceChange={this.updateBalances}
                      currentAccount={this.state.currentAccount}
                      selectedToken={this.state.selectedToken} />
              <br/>
          
              <Withdraw balances={this.state.balances} 
                        onBalanceChange={this.updateBalances}
                        currentAccount={this.state.currentAccount}
                        selectedToken={this.state.selectedToken} />
              <br/>
            </div>
            <div className="col-md-3"> 
              <Buy currentAccount={this.state.currentAccount}
                   balances={this.state.balances} 
                   onBuy={this.updateBalances}
                   selectedToken={this.state.selectedToken}/>

              <br />
              <OrderBook currentAccount={this.state.currentAccount}
                         type="Ask"
                         selectedToken={this.state.selectedToken}/>
            </div>
            <div className="col-md-3"> 
              <Sell currentAccount={this.state.currentAccount}
                   balances={this.state.balances} 
                   onSell={this.updateBalances}
                   selectedToken={this.state.selectedToken}/>
              <br />
              <OrderBook type="Bid"
                         selectedToken={this.state.selectedToken}/>
            </div>
            <div className="col-md-3">
              <RecentTradeHistory selectedToken={this.state.selectedToken}/>
              <br />
              <MyOpenOrders currentAccount={this.state.currentAccount} 
                            selectedToken={this.state.selectedToken}/>
            </div>
          </div>
          
        </div>
    );
  }

  updateBalances = () => {
    this._loadEtherBalances(this.state.currentAccount);
    this._loadTokenBalances(this.state.selectedToken.contractAddress, this.state.currentAccount);
  }

  _loadTokenBalances(contractAddress, currentAccount){
      zephyr.methods.getTokenBalance(contractAddress)
        .call({from: currentAccount})
        .then((tokenOnExchange) => {
            var balances = {...this.state.balances};
            balances.tokenOnExchange = tokenOnExchange;
            this.setState({balances});
        });

      Erc20Token(contractAddress).methods.balanceOf(currentAccount)
        .call()
        .then((tokenInWallet) => {
            var balances = {...this.state.balances};
            balances.tokenInWallet = tokenInWallet;
            this.setState({balances});
        });
  }

  _loadEtherBalances(currentAccount){
      web3.eth.getBalance(currentAccount)
              .then(availableWei =>{
                  var balances = {...this.state.balances};
                  balances.etherInWallet = web3.utils.fromWei(availableWei);
                  this.setState({balances});
              });

      zephyr.methods.getEtherBalanceInWei()
          .call({from: currentAccount})
          .then((etherOnExchange) => {
            var balances = {...this.state.balances};
            balances.etherOnExchange = web3.utils.fromWei(etherOnExchange);
            this.setState({balances});
          });
  }
}

export default App;
