// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract RevenueDistributor is Ownable {
    IERC20 public shareToken; // Токен-доля, среди держателей которого распределяем

    event RevenueDistributed(uint256 totalAmount, uint256 holdersCount);

    constructor(address _shareToken) {
        shareToken = IERC20(_shareToken);
    }

    receive() external payable {}

    // Распределение ETH держателям долей
    function distributeEther(
        address[] calldata holders
    ) external payable onlyOwner {
        require(msg.value > 0, 'No ether sent');

        uint256 totalSupply = shareToken.totalSupply();
        require(totalSupply > 0, 'No shares exist');

        uint256 totalDistributed;

        for (uint256 i = 0; i < holders.length; i++) {
            uint256 balance = shareToken.balanceOf(holders[i]);
            if (balance > 0) {
                uint256 shareAmount = (msg.value * balance) / totalSupply;
                (bool success, ) = payable(holders[i]).call{value: shareAmount}(
                    ''
                );
                require(success, 'Transfer to holder failed');
                totalDistributed += shareAmount;
            }
        }

        emit RevenueDistributed(totalDistributed, holders.length);

        // Возвращаем остаток (если есть) владельцу
        uint256 remainder = msg.value - totalDistributed;
        if (remainder > 0) {
            (bool success, ) = payable(owner()).call{value: remainder}('');
            require(success, 'Returning remainder failed');
        }
    }

    // Функция для вывода накопленных средств владельцем (на случай ошибок или остатков)
    function withdrawEther(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, 'Insufficient balance');
        (bool success, ) = payable(owner()).call{value: amount}('');
        require(success, 'Withdrawal failed');
    }
}
