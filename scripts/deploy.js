// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with signer:", await deployer.getAddress());

  // 1. UniqueNFT
  const UniqueNFT = await ethers.getContractFactory("UniqueNFT");
  const nft = await UniqueNFT.deploy();
  await nft.waitForDeployment();
  const nftAddr = await nft.getAddress();
  console.log("✔ UniqueNFT deployed at:", nftAddr);

  // 2. FractionShareToken
  const FractionToken = await ethers.getContractFactory("FractionShareToken");
  const totalShares = ethers.parseEther("1000");
  const fractionToken = await FractionToken.deploy(
    "FractionShares",
    "FRAC",
    totalShares,
    await deployer.getAddress()
  );
  await fractionToken.waitForDeployment();
  const fractionAddr = await fractionToken.getAddress();
  console.log("✔ FractionShareToken deployed at:", fractionAddr);

  // 3. ShareSale
  const ShareSale = await ethers.getContractFactory("ShareSale");
  const shareSale = await ShareSale.deploy();
  await shareSale.waitForDeployment();
  const shareSaleAddr = await shareSale.getAddress();
  console.log("✔ ShareSale deployed at:", shareSaleAddr);

  // Связываем Sale c токеном
  await shareSale.setShareToken(fractionAddr);
  console.log("✔ ShareSale connected to FractionShareToken");

  // 4. RevenueDistributor
  const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");
  const distributor = await RevenueDistributor.deploy(fractionAddr);
  await distributor.waitForDeployment();
  const distributorAddr = await distributor.getAddress();
  console.log("✔ RevenueDistributor deployed at:", distributorAddr);

  // 5. Mint NFT
  const txMint = await nft.mintUnique(
    await deployer.getAddress(),
    "S19 Pro",
    "Iceland",
    110,
    "ipfs://someASICuri"
  );
  await txMint.wait();
  console.log("✔ Minted 1 NFT to deployer (tokenId=0)");

  // Баланс deployer
  const bal = await fractionToken.balanceOf(await deployer.getAddress());
  console.log("Deployer now holds (FRAC) =", bal.toString());

  console.log("\n✅ Deployment script finished!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
