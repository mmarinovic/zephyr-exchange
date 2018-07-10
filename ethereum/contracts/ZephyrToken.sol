pragma solidity ^0.4.23;

import { Erc20Token } from "./Erc20Token.sol";

interface tokenRecipient { function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external; }

contract ZephyrToken is Erc20Token {

    string public name;
    string public symbol;
    uint public decimals;

    uint _totalSupply;
    mapping(address => uint) _balanceOf;
    mapping(address => mapping(address => uint)) _allowance;

    constructor() public {
        name = "Zephyr Exchange Token";
        symbol = "ZET";
        decimals = 18;
        _totalSupply = 1000000 * 10**uint(decimals);

        _balanceOf[msg.sender] = _totalSupply;
    }

    function totalSupply() public view returns (uint){
        return _totalSupply;
    }

    function balanceOf(address tokenOwner) public view returns (uint balance){
        return _balanceOf[tokenOwner];
    }

    function allowance(address tokenOwner, address spender) public view returns (uint remaining){
        return _allowance[tokenOwner][spender];
    }

    function transfer(address to, uint value) public returns (bool success){
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint value) public returns (bool success){
        require(_allowance[from][msg.sender] >= value);
        
        _allowance[from][msg.sender] -= value;
        _transfer(from, to, value);

        return true;
    }

    function approve(address spender, uint value) public returns (bool succes) {
        _allowance[msg.sender][spender] = value;
        return true;
    }

    function approveAndCall(address spender, uint value, bytes extraData) public returns (bool success){
        tokenRecipient _spender = tokenRecipient(spender);
        if(approve(spender, value)){
            _spender.receiveApproval(msg.sender, value, this, extraData);
            return true;
        }
    }

    function() public payable {
        require(false);
    }

    function _transfer(address from, address to, uint value) internal{
        require(to != 0x0);
        require(_balanceOf[from] >= value);
        require(_balanceOf[to] + value >= _balanceOf[to]);

        uint previousBalance = _balanceOf[from] + _balanceOf[to];

        _balanceOf[from] -= value;
        _balanceOf[to] += value;

        emit Transfer(from, to, value);

        assert(_balanceOf[from] + _balanceOf[to] == previousBalance);
    }
}