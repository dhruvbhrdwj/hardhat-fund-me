const { getNamedAccounts, deployments, network } = require("hardhat");

const {
  networkConfig,
  developmentChains,
  liveChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

const liveChainsId = [
  {
    name: "rinkeby",
    ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
  },
  {
    name: "polygon",
    ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
  },
];

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  // if chainid is X , use address Y
  // when going for localhost or hardhat network , we will use a MOCK
  let ethUsdPriceFeedAddress; /*= networkConfig[chainId]["ethUsdPriceFeed"];*/
  if (developmentChains.includes) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else if (liveChainsId.includes) {
    ethUsdPriceFeedAddress = liveChainsId[liveChains]["ethUsdPriceFeed"];
  }

  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: [ethUsdPriceFeedAddress],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (liveChainsId.includes && process.env.ETHERSCAN_API_KEY) {
    await verify(fundMe.address, [ethUsdPriceFeedAddress]);
  }

  log("------------------------------------------------------");
};
// module.exports.default = deployFunc;
module.exports.tags = ["all", "fundme"];
