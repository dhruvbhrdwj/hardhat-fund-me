// Fund the contract
const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const deployer = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("funding the contract......")
    const transactionResponse = await fundMe.fund({
        value: ethers.utils.parseEther("0.1"),
    })
    const transactionReceipt = await transactionResponse.wait(1)
    console.log(
        `Funded!!!! here is the transaction receipt ${transactionReceipt}`
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
