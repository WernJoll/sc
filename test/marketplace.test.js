const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UniqueNFT", function () {
  let deployer, user1, user2;
  let uniqueNFT;

  before(async () => {
    // Берём первые 3 аккаунта из Hardhat (0 - deployer)
    [deployer, user1, user2] = await ethers.getSigners();
  });

  it("should deploy the UniqueNFT contract", async function () {
    const NFT = await ethers.getContractFactory("UniqueNFT");
    uniqueNFT = await NFT.deploy();
    await uniqueNFT.waitForDeployment();

    const nftAddr = await uniqueNFT.getAddress();
    expect(nftAddr).to.properAddress;
  });

  it("should mint NFT with correct config by the owner (deployer)", async function () {
    // Вызовем mintUnique от имени deployer (который = owner)
    const model = "S19 Pro";
    const location = "Iceland";
    const power = 110;
    const metaURI = "ipfs://asicMetadataHash";

    await uniqueNFT.mintUnique(
      user1.address,
      model,
      location,
      power,
      metaURI
    );

    // Проверим, что tokenId=0 выпущен
    // nextTokenId изначально 0, после вызова стала 1
    // Владельцем должен быть user1
    const ownerOf0 = await uniqueNFT.ownerOf(0);
    expect(ownerOf0).to.equal(user1.address);

    // Проверим, что getASICConfig(0) вернёт корректные данные
    const config0 = await uniqueNFT.getASICConfig(0);
    expect(config0.model).to.equal(model);
    expect(config0.location).to.equal(location);
    // В Ethers v6 числа - BigInt
    expect(config0.power).to.equal(BigInt(power));
    expect(config0.metadataURI).to.equal(metaURI);

    // Проверим, что nextTokenId = 1
    const nextId = await uniqueNFT.nextTokenId();
    expect(nextId).to.equal(1n);
  });

  it("should not allow user2 to mint new NFT", async function () {
    // Попробуем вызвать mintUnique от лица user2
    await expect(
      uniqueNFT.connect(user2).mintUnique(
        user2.address,
        "S19 XP",
        "Norway",
        120,
        "ipfs://anotherURI"
      )
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should mint another NFT (ID=1) for user2 if called by owner", async function () {
    // Владелец опять deployer
    await uniqueNFT.mintUnique(
      user2.address,
      "M30S++",
      "Canada",
      100,
      "ipfs://anotherMeta"
    );

    // Теперь tokenId=1 принадлежит user2
    const owner1 = await uniqueNFT.ownerOf(1);
    expect(owner1).to.equal(user2.address);

    // Проверим структуру
    const config1 = await uniqueNFT.getASICConfig(1);
    expect(config1.model).to.equal("M30S++");
    expect(config1.location).to.equal("Canada");
    expect(config1.power).to.equal(100n);
    expect(config1.metadataURI).to.equal("ipfs://anotherMeta");

    // nextTokenId = 2
    const nextId = await uniqueNFT.nextTokenId();
    expect(nextId).to.equal(2n);
  });

  it("should revert getASICConfig for nonexistent token", async function () {
    // Пока выпущены токены 0 и 1, значит tokenId=999 не существует
    await expect(uniqueNFT.getASICConfig(999)).to.be.revertedWith("Nonexistent token");
  });
});
