const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const weiAmount = (await ethers.provider.getBalance(deployer.address)).toString();


    console.log("Account balance:", ethers.formatEther(weiAmount));

    // make sure to replace the "GoofyGoober" reference with your own ERC-20 name!
    const CarNft = await ethers.getContractFactory("Car");
    const carNft = await CarNft.deploy(deployer.address,"https://ipfs.io/ipfs/");
    console.log("Car Nft address:", await carNft.getAddress());

    const House = await ethers.getContractFactory("House");
    const house = await House.deploy(deployer.address,"https://ipfs.io/ipfs/");
    console.log("House Nft address:", await house.getAddress());

    const Notary = await ethers.getContractFactory("Notary");
    const notary = await Notary.deploy();
    console.log("Notary address:", await notary.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
