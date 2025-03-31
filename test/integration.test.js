const { expect } = require("chai");
const { ethers, network } = require("hardhat");

// Интеграционные тесты (локально и для Sepolia)
describe("Integration tests for Marketplace Contracts", function () {
  let deployer, renter, fractionHolder;
  let uniqueNFT, fractionShareToken, shareSale, revenueDistributor;

  before(async () => {
    [deployer, renter, fractionHolder] = await ethers.getSigners();

    // Deploy UniqueNFT
    const UniqueNFT = await ethers.getContractFactory("UniqueNFT");
    uniqueNFT = await UniqueNFT.deploy();
    await uniqueNFT.waitForDeployment();

    // Mint NFT
    await uniqueNFT.mintUnique(deployer.address, "S19 Pro", "Iceland", 110, "ipfs://metadata");

    // Deploy FractionShareToken
    const FractionToken = await ethers.getContractFactory("FractionShareToken");
    fractionShareToken = await FractionToken.deploy(
      "FractionShares",
      "FRAC",
      ethers.parseEther("1000"),
      deployer.address
    );
    await fractionShareToken.waitForDeployment();

    // Transfer fractions to holder
    await fractionShareToken.transfer(fractionHolder.address, ethers.parseEther("400")); // 40%

    // Deploy ShareSale
    const ShareSale = await ethers.getContractFactory("ShareSale");
    shareSale = await ShareSale.deploy();
    await shareSale.waitForDeployment();

    // Deploy RevenueDistributor
    const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");
    revenueDistributor = await RevenueDistributor.deploy(await fractionShareToken.getAddress());
    await revenueDistributor.waitForDeployment();
  });

  it("should mint NFT correctly", async () => {
    const owner = await uniqueNFT.ownerOf(0);
    expect(owner).to.equal(deployer.address);

    const config = await uniqueNFT.getASICConfig(0);
    expect(config.model).to.equal("S19 Pro");
  });

  it("should distribute fraction tokens correctly", async () => {
    const holderBalance = await fractionShareToken.balanceOf(fractionHolder.address);
    expect(holderBalance).to.equal(ethers.parseEther("400"));
  });

  it("should accept rental payments and distribute revenue", async () => {
    // Simulate renter paying rent
    const rentAmount = ethers.parseEther("1");
    await revenueDistributor.connect(deployer).distributeEther(
      [deployer.address, fractionHolder.address],
      { value: rentAmount }
    );

    // Holder initial balance
    const holderInitBalance = await ethers.provider.getBalance(fractionHolder.address);

    // Distribute revenue explicitly to holders by owner
    await revenueDistributor.connect(deployer).distributeEther(
      [deployer.address, fractionHolder.address],
      { value: rentAmount }
    );

    // Check fractionHolder (40%) received payment
    const holderFinalBalance = await ethers.provider.getBalance(fractionHolder.address);
    expect(holderFinalBalance).to.be.gt(holderInitBalance);
  });

  // Дополнительный тест только для локальной сети
  if (network.name === "localhost" || network.name === "hardhat") {
    it("should allow deploying additional NFTs locally", async () => {
      await uniqueNFT.mintUnique(renter.address, "M30S", "Canada", 90, "ipfs://meta2");
      const owner = await uniqueNFT.ownerOf(1);
      expect(owner).to.equal(renter.address);
    });
  }
});