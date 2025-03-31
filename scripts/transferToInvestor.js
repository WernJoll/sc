const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const investorAddress = "0xINVESTOR_ADDRESS_HERE"; 

  const nftAddress = "0xNFT_CONTRACT_ADDRESS";       
  const tokenAddress = "0xERC20_CONTRACT_ADDRESS";    

  const UniqueNFT = await ethers.getContractAt("UniqueNFT", nftAddress);
  const tokenId = 0; 

  const tx1 = await UniqueNFT.transferFrom(deployer.address, investorAddress, tokenId);
  await tx1.wait();
  console.log(`✔ NFT #${tokenId} передан инвестору ${investorAddress}`);

  const FractionShareToken = await ethers.getContractAt("FractionShareToken", tokenAddress);
  const balance = await FractionShareToken.balanceOf(deployer.address);

  const tx2 = await FractionShareToken.transfer(investorAddress, balance);
  await tx2.wait();
  console.log(`✔ Все токены (${ethers.formatEther(balance)} FRAC) переданы инвестору ${investorAddress}`);

  console.log("\n✅ Передача NFT и токенов завершена.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
