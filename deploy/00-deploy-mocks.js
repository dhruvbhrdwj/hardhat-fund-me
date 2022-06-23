const network = require("hardhat");
// const { networks } = require("../hardhat.config");
const { networkConfig } = require("../helper-hardhat-config");
const {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  // If we are on a local develohelppment network, we need to deploy mocks!
  if (/*networkConfig[31337].name == "localhost"*/ developmentChains.includes) {
    log("Local network detected! Deploying mocks...");
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    });
    log("Mocks Deployed!");
    log("------------------------------------------------");
  }
};

module.exports.tags = ["all", "mocks"];
