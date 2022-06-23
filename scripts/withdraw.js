const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Withdrawing from the account......")
    const transactionResponse = await fundMe.withdraw()
    const transactionReceipt = await transactionResponse.wait(1)
    console.log(`Got it back into the account !!!!! at ${transactionReceipt}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
