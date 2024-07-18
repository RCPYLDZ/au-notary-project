const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { assert,expect } = require("chai");
const { ethers } = require("hardhat");
const {parseEther} = require("ethers");

describe("Notary", function () {
  async function deployFixture() {
    const [owner, seller,buyer] = await ethers.getSigners();

    const Car = await ethers.getContractFactory("Car");
    const car = await Car.deploy(owner.address,"https://ipfs.io/ipfs/");

    const House = await ethers.getContractFactory("House");
    const house = await House.deploy(owner.address,"https://ipfs.io/ipfs/");

    const Notary = await ethers.getContractFactory("Notary");
    const notary = await Notary.deploy();


    await notary.transfer(buyer,ethers.parseEther("10000"));

    return { car, house, notary, owner, seller, buyer };
  }

  it("should mint a  car for seller account", async () => {
    const { car,seller } = await loadFixture(deployFixture);

    await car.safeMint(seller.address,1,"https://ipfs.io/ipfs/QmSdLhHup7DQ3oWyGUfK9uAuLVxjAuzQdDKCdNaxXUbBck");
    assert((await car.ownerOf(1)) === seller.address);
  });

  it("should mint a  house for seller account", async () => {
    const { house,seller } = await loadFixture(deployFixture);

    await house.safeMint(seller.address,2,"https://ipfs.io/ipfs/QmdSUDfH24ZFoiAXvfStGPzMi2x1VnqX7ymTciqXG5Q8o1");
    assert((await house.ownerOf(2)) === seller.address);
  });

  it("should seller create an order for a car nft", async () => {
    const { car,notary,seller,buyer } = await loadFixture(deployFixture);
    await car.safeMint(seller.address,1,"https://ipfs.io/ipfs/QmSdLhHup7DQ3oWyGUfK9uAuLVxjAuzQdDKCdNaxXUbBck");
    await car.connect(seller).approve(await notary.getAddress(),1);
    await notary.connect(seller).sellOrder(await car.getAddress(),buyer.address,1,ethers.parseEther("200"));
    const order = await notary.connect(seller).getListedOrder();
    assert(order[0] === await car.getAddress() && order[1] === buyer.address && parseInt(order[2]) === 1 && parseInt(order[3]) === 200000000000000000000 && order[4] === false);
  });

  it("should seller create an order for a house nft", async () => {
    const { house,notary,seller,buyer } = await loadFixture(deployFixture);
    await house.safeMint(seller.address,2,"https://ipfs.io/ipfs/QmdSUDfH24ZFoiAXvfStGPzMi2x1VnqX7ymTciqXG5Q8o1");
    await house.connect(seller).approve(await notary.getAddress(),2);
    await notary.connect(seller).sellOrder(await house.getAddress(),buyer.address,2,ethers.parseEther("500"));
    const order = await notary.connect(seller).getListedOrder();
    assert(order[0] === await house.getAddress() && order[1] === buyer.address && parseInt(order[2]) === 2 && parseInt(order[3]) === 500000000000000000000 && order[4] === false);
  });

  it("should buyer be able to buy the car", async () => {
    const { car,notary,seller,buyer } = await loadFixture(deployFixture);
    await car.safeMint(seller.address,1,"https://ipfs.io/ipfs/QmSdLhHup7DQ3oWyGUfK9uAuLVxjAuzQdDKCdNaxXUbBck");
    await car.connect(seller).approve(await notary.getAddress(),1);
    await notary.connect(seller).sellOrder(await car.getAddress(),buyer.address,1,ethers.parseEther("200"));
    const sellerBalanceBeforeSell = await notary.balanceOf(seller.address);
    await notary.connect(buyer).payForOrder(seller.address);
    const sellerBalanceAfterSell = await notary.balanceOf(seller.address);
    assert((await car.ownerOf(1)) === buyer.address);
    assert(parseInt(sellerBalanceAfterSell-sellerBalanceBeforeSell) === parseInt(parseEther("200").toString()));
  });

  it("should buyer be able to buy the house", async () => {
    const { house,notary,seller,buyer } = await loadFixture(deployFixture);
    await house.safeMint(seller.address,2,"https://ipfs.io/ipfs/QmdSUDfH24ZFoiAXvfStGPzMi2x1VnqX7ymTciqXG5Q8o1");
    await house.connect(seller).approve(await notary.getAddress(),2);
    await notary.connect(seller).sellOrder(await house.getAddress(),buyer.address,2,ethers.parseEther("500"));
    const sellerBalanceBeforeSell = await notary.balanceOf(seller.address);
    await notary.connect(buyer).payForOrder(seller.address);
    const sellerBalanceAfterSell = await notary.balanceOf(seller.address);
    assert((await house.ownerOf(2)) === buyer.address);
    assert(parseInt(sellerBalanceAfterSell-sellerBalanceBeforeSell) === parseInt(parseEther("500").toString()));
  });



  it("should be reverted when seller not approve the nft before sell order", async () => {
    const { car,notary,seller,buyer } = await loadFixture(deployFixture);
    await car.safeMint(seller.address,1,"https://ipfs.io/ipfs/QmSdLhHup7DQ3oWyGUfK9uAuLVxjAuzQdDKCdNaxXUbBck");
    await expect(notary.connect(seller).sellOrder(await car.getAddress(),buyer.address,1,ethers.parseEther("200"))).to.be.revertedWith("NFT must be approved for the notary contract.");
  });

  it("should be reverted when seller cancel the order before approve cancel for the nft", async () =>{
    const { house,notary,seller,buyer } = await loadFixture(deployFixture);
    await house.safeMint(seller.address,2,"https://ipfs.io/ipfs/QmdSUDfH24ZFoiAXvfStGPzMi2x1VnqX7ymTciqXG5Q8o1");
    await house.connect(seller).approve(await notary.getAddress(),2);
    await notary.connect(seller).sellOrder(await house.getAddress(),buyer.address,2,ethers.parseEther("500"));
    await expect(notary.connect(seller).cancelSellOrder()).to.be.revertedWith("NFT approvement must be removed before cancel.");
  });

  it("should be reverted when seller cancel the order before payOrder call", async () =>{
    const { house,notary,seller,buyer } = await loadFixture(deployFixture);
    await house.safeMint(seller.address,2,"https://ipfs.io/ipfs/QmdSUDfH24ZFoiAXvfStGPzMi2x1VnqX7ymTciqXG5Q8o1");
    await house.connect(seller).approve(await notary.getAddress(),2);
    await notary.connect(seller).sellOrder(await house.getAddress(),buyer.address,2,ethers.parseEther("500"));
    await house.connect(seller).approve(ethers.getAddress("0x0000000000000000000000000000000000000000"),2);
    await notary.connect(seller).cancelSellOrder();
    await expect(notary.connect(buyer).payForOrder(seller.address)).to.be.reverted;
  });

  it("should be only one active sell order for the same seller", async () =>{
    const { house,notary,seller,buyer } = await loadFixture(deployFixture);
    await house.safeMint(seller.address,2,"https://ipfs.io/ipfs/QmdSUDfH24ZFoiAXvfStGPzMi2x1VnqX7ymTciqXG5Q8o1");
    await house.safeMint(seller.address,3,"https://ipfs.io/ipfs/Qmd2WxwFcYhVgMctbY4pZNukpAKHneNQVeA9zdLq1y9Vqk");
    await house.connect(seller).approve(await notary.getAddress(),2);
    await notary.connect(seller).sellOrder(await house.getAddress(),buyer.address,2,ethers.parseEther("500"));
    await house.connect(seller).approve(await notary.getAddress(),3);
    await expect(notary.connect(seller).sellOrder(await house.getAddress(),buyer.address,3,ethers.parseEther("200"))).to.be.revertedWith("Only one active sell order can be handled at a time.");
  });

});
