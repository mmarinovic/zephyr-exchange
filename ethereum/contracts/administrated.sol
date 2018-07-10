pragma solidity ^0.4.23;

contract administrated {

    address public admin;

    constructor() public{
        admin = msg.sender;
    }

    modifier onlyAdmin {
        require(msg.sender == admin);
        _;
    }

    function changeAdmin(address newAdmin) public onlyAdmin{
        admin = newAdmin;
    }
}