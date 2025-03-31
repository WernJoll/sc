// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract UniqueNFT is ERC721, Ownable {
    uint256 public nextTokenId;

    struct ASICConfig {
        string model; // напр. "S19 Pro"
        string location; // напр. "Iceland"
        uint256 power; // напр. 110 TH/s
        string metadataURI; // ipfs-ссылка или иное
    }

    mapping(uint256 => ASICConfig) public asicConfigs;

    constructor() ERC721('UniqueNFT', 'UNFT') {}

    /**
     * @dev Минтим уникальный NFT с конфигом ASIC, только владелец контракта (Ownable) может вызывать.
     * @param to — адрес, которому выдаётся NFT
     * @param _model — модель ASIC
     * @param _location — локация ASIC
     * @param _power — мощность/хэшрейт
     * @param _metadataURI — URI для дополнительных метаданных (ipfs и т.п.)
     */
    function mintUnique(
        address to,
        string memory _model,
        string memory _location,
        uint256 _power,
        string memory _metadataURI
    ) external onlyOwner {
        uint256 tokenId = nextTokenId;
        nextTokenId++;

        asicConfigs[tokenId] = ASICConfig({
            model: _model,
            location: _location,
            power: _power,
            metadataURI: _metadataURI
        });

        _safeMint(to, tokenId);
    }

    function getASICConfig(
        uint256 tokenId
    ) external view returns (ASICConfig memory) {
        require(_exists(tokenId), 'Nonexistent token');
        return asicConfigs[tokenId];
    }
}
