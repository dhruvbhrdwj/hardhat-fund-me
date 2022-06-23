const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
!developmentChains.includes
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1") // 1 ETH
          beforeEach(async function () {
              // deploy the contract first
              // // use the hardhat deploy
              // const accounts = await ethers.getSigners();
              // const accountZero = accounts[0];
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"]) // all the contracts are first deployed as we had the tags with ['all']
              fundMe = await ethers.getContract("FundMe", deployer) // get the most recent deployed fundme contract
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              ) // get the most recent contract instance
          })
          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.s_priceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              it("Fails if you dont send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("Updates the amountFunded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.s_addressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to the array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.s_funders(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", async function () {
              // in order to test the withdraw function , we need to first have some funds in the contract. So we first use BeforeEach and deposit some ether
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("withdraw ETH from a single founder", async function () {
                  // arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address) // the balance is fetched from the blockchain, so we use bignumber.add
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // assert

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              it("Allows us to withdraw with multiple funders", async function () {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let account of accounts) {
                      // looping over these accounts and funding them
                      const fundMeConnectedContract = fundMe.connect(account) // before this, the deployer was connected with the contract , so we need to connect all the accounts to the contract first
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // assert

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // make sure the funders are reset properly
                  await expect(fundMe.s_funders(0)).to.be.reverted
                  for (let account of accounts) {
                      // checking whether the funders are reset properly after withdrawl
                      assert.equal(
                          await fundMe.s_addressToAmountFunded(account.address),
                          0
                      )
                  }
              })
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })

              it("cheaperWithdraw testing...", async function () {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let account of accounts) {
                      // looping over these accounts and funding them
                      const fundMeConnectedContract = fundMe.connect(account) // before this, the deployer was connected with the contract , so we need to connect all the accounts to the contract first
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // assert

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // make sure the s_funders are reset properly
                  await expect(fundMe.s_funders(0)).to.be.reverted
                  for (let account of accounts) {
                      // checking whether the funders are reset properly after withdrawl
                      assert.equal(
                          await fundMe.s_addressToAmountFunded(account.address),
                          0
                      )
                  }
              })
          })
      })
