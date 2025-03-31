const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration tests on Sepolia", function () {
  this.timeout(600000); // ← увеличить таймаут до 2 минут
  
  let deployer;
  let uniqueNFT, fractionShareToken, shareSale, revenueDistributor;

  before(async () => {
    [deployer] = await ethers.getSigners();

    const UniqueNFT = await ethers.getContractFactory("UniqueNFT");
    uniqueNFT = await UniqueNFT.deploy();
    await uniqueNFT.waitForDeployment();

    await uniqueNFT.mintUnique(deployer.address, "S19 Pro", "Iceland", 110, "ipfs://metadata");

    const FractionToken = await ethers.getContractFactory("FractionShareToken");
    fractionShareToken = await FractionToken.deploy(
      "FractionShares",
      "FRAC",
      ethers.parseEther("1000"),
      deployer.address
    );
    await fractionShareToken.waitForDeployment();

    const ShareSale = await ethers.getContractFactory("ShareSale");
    shareSale = await ShareSale.deploy();
    await shareSale.waitForDeployment();

    const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");
    revenueDistributor = await RevenueDistributor.deploy(await fractionShareToken.getAddress());
    await revenueDistributor.waitForDeployment();
  });

  it("should mint NFT correctly", async () => {
    const owner = await uniqueNFT.ownerOf(0);
    expect(owner).to.equal(deployer.address);
  });

  it("should distribute fraction tokens correctly", async () => {
    const deployerBalance = await fractionShareToken.balanceOf(deployer.address);
    expect(deployerBalance).to.equal(ethers.parseEther("1000"));
  });

  it("should accept rental payments and distribute revenue", async () => {
    const rentAmount = ethers.parseEther("1");

    await deployer.sendTransaction({
      to: await revenueDistributor.getAddress(),
      value: rentAmount
    });

    const distBalance = await ethers.provider.getBalance(await revenueDistributor.getAddress());
    expect(distBalance).to.equal(rentAmount);

    const initBalance = await ethers.provider.getBalance(deployer.address);

    await revenueDistributor.connect(deployer).distributeEther([deployer.address], {value: rentAmount});

    const finalBalance = await ethers.provider.getBalance(deployer.address);
    expect(finalBalance).to.be.gt(initBalance - rentAmount);
  });
});
