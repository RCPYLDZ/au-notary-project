// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Notary is ERC20, ERC20Permit {
    struct Order{
        address nftContractAddress;
        address buyerAddress;
        uint tokenId;
        uint price;
        bool isPaid;
    }

    address private NULL_ADDRESS = address(0);
    mapping(address => Order) public activeOrders;
    constructor() ERC20("Notary", "NTR") ERC20Permit("Notary") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    event SellOrder(address,address,uint,uint);
    function sellOrder(address nftContract,address buyerAddress,uint nftId,uint price) external {
        require(activeOrders[msg.sender].nftContractAddress == NULL_ADDRESS,"Only one active sell order can be handled at a time.");
        require(IERC721(nftContract).ownerOf(nftId) == msg.sender);
        require(IERC721(nftContract).getApproved(nftId) == address(this),"NFT must be approved for the notary contract.");
        require(msg.sender != buyerAddress);
        activeOrders[msg.sender] = Order(nftContract, buyerAddress, nftId, price,false);
        emit SellOrder(nftContract,buyerAddress,nftId,price);
    }

    function cancelSellOrder() external {
        require(activeOrders[msg.sender].nftContractAddress != NULL_ADDRESS);
        require(IERC721(activeOrders[msg.sender].nftContractAddress).getApproved(activeOrders[msg.sender].tokenId) == NULL_ADDRESS,"NFT approvement must be removed before cancel.");
        activeOrders[msg.sender].nftContractAddress = NULL_ADDRESS;
        activeOrders[msg.sender].buyerAddress = NULL_ADDRESS;
        activeOrders[msg.sender].price = 0;
        activeOrders[msg.sender].isPaid = false;
    }

    function getListedOrder() external view returns(Order memory){
        return activeOrders[msg.sender];
    }

    function getWaitingOrderAggreement(address ownerOfNft) external view returns(Order memory){
        Order memory order = activeOrders[ownerOfNft];
        require(order.buyerAddress == msg.sender);
        return order;
    }

    event PayForOrder(address,address,address,uint);
    function payForOrder(address ownerOfNft) external {
        require(msg.sender == activeOrders[ownerOfNft].buyerAddress);
        require(this.balanceOf(msg.sender) >= activeOrders[ownerOfNft].price);
        require(!activeOrders[msg.sender].isPaid,"Sell order must be not completed.");
        Order storage order = activeOrders[ownerOfNft];
        IERC721(order.nftContractAddress).transferFrom(ownerOfNft,order.buyerAddress,order.tokenId);
        bool result= transfer(ownerOfNft,order.price);
        require(result);
        activeOrders[ownerOfNft].nftContractAddress = NULL_ADDRESS;
        activeOrders[msg.sender].isPaid = true;
        emit PayForOrder(order.nftContractAddress,order.buyerAddress,ownerOfNft,order.price);
    }

}
