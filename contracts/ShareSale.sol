// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract ShareSale {
    struct Sale {
        address seller;
        uint256 amount;
        uint256 price; // В wei
    }

    IERC20 public shareToken;
    mapping(uint256 => Sale) public sales;
    uint256 public nextSaleId;

    event SaleCreated(
        uint256 indexed saleId,
        address indexed seller,
        uint256 amount,
        uint256 price
    );
    event SaleCancelled(uint256 indexed saleId);
    event SaleCompleted(uint256 indexed saleId, address indexed buyer);

    constructor() {}

    function setShareToken(address token) external {
        require(address(shareToken) == address(0), 'Token already set');
        shareToken = IERC20(token);
    }

    function createSale(uint256 amount, uint256 price) external {
        require(amount > 0 && price > 0, 'Invalid sale');
        require(
            shareToken.allowance(msg.sender, address(this)) >= amount,
            'Approve tokens first'
        );

        sales[nextSaleId] = Sale(msg.sender, amount, price);
        emit SaleCreated(nextSaleId, msg.sender, amount, price);
        nextSaleId++;
    }

    function cancelSale(uint256 saleId) external {
        Sale memory s = sales[saleId];
        require(s.seller == msg.sender, 'Not your sale');
        delete sales[saleId];
        emit SaleCancelled(saleId);
    }

    function buy(uint256 saleId) external payable {
        Sale memory s = sales[saleId];
        require(s.amount > 0, "Sale doesn't exist");
        require(msg.value == s.price, 'Incorrect ETH');

        // Удаляем до перевода, чтобы предотвратить повторное выполнение
        delete sales[saleId];

        // Перевод токенов покупателю
        require(
            shareToken.transferFrom(s.seller, msg.sender, s.amount),
            'Token transfer failed'
        );

        // Перевод ETH продавцу
        payable(s.seller).transfer(msg.value);

        emit SaleCompleted(saleId, msg.sender);
    }

    function getSale(uint256 saleId) external view returns (Sale memory) {
        return sales[saleId];
    }
}
