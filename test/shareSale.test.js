const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ShareSale", function () {
  let deployer, buyer;
  let shareToken, shareSale;

  beforeEach(async () => {
    [deployer, buyer] = await ethers.getSigners();

    // Deploy токен и минтим на deployer
    const Token = await ethers.getContractFactory("FractionShareToken");
    shareToken = await Token.deploy("FractionShares", "FRAC", ethers.parseEther("1000"), deployer.address);
    await shareToken.waitForDeployment();

    // Deploy ShareSale
    const Sale = await ethers.getContractFactory("ShareSale");
    shareSale = await Sale.deploy();
    await shareSale.waitForDeployment();

    // Установка адреса токена
    await shareSale.setShareToken(await shareToken.getAddress());

    // Апрув токенов для контракта
    await shareToken.approve(await shareSale.getAddress(), ethers.parseEther("100"));
  });

  it("should create a sale", async () => {
    await shareSale.createSale(ethers.parseEther("50"), ethers.parseEther("1"));

    const sale = await shareSale.getSale(0);
    expect(sale.seller).to.equal(deployer.address);
    expect(sale.amount).to.equal(ethers.parseEther("50"));
    expect(sale.price).to.equal(ethers.parseEther("1"));
  });

  it("should allow someone to buy a share", async () => {
    await shareSale.createSale(ethers.parseEther("50"), ethers.parseEther("1"));

    const buyerAddr = await buyer.getAddress();
    const saleAddr = await shareSale.getAddress();

    // transferFrom будет сработать, если seller → buyer через sale
    await shareToken.connect(deployer).approve(saleAddr, ethers.parseEther("50"));

    const sale = await shareSale.getSale(0);
    await shareSale.connect(buyer).buy(0, { value: sale.price });

    const buyerBalance = await shareToken.balanceOf(buyerAddr);
    expect(buyerBalance).to.equal(sale.amount);
  });

  it("should allow seller to cancel the sale", async () => {
    await shareSale.createSale(ethers.parseEther("20"), ethers.parseEther("0.5"));
    await shareSale.cancelSale(0);

    const sale = await shareSale.getSale(0);
    expect(sale.seller).to.equal(ethers.ZeroAddress);
  });
});
