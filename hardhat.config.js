require("@nomicfoundation/hardhat-toolbox");

module.exports = {
    solidity: "0.8.24",
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545"
        }
    }
};

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
    solidity: "0.8.24",
    networks: {
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL,
            accounts: [process.env.PRIVATE_KEY],
            chainId: 11155111,
        },
        localhost: {
            url: "http://127.0.0.1:8545"
        }
    },
};
