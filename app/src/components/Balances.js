import React, { Component } from 'react';

class Balances extends Component{

    state = {
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
                <h5 className="card-title">Your Balances</h5>
                    <table className="table">
                        <tbody>
                            <tr>
                                <th>ETH</th>
                                <td>{this.props.balances.etherOnExchange}</td>
                            </tr>
                            <tr>
                                <th>{this.state.selectedToken.symbol}</th>
                                <td>{this.props.balances.tokenOnExchange}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

export default Balances;