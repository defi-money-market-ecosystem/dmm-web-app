import DmmController from "../abi/DmmController";
import DmmToken from "../abi/DmmToken";
import DmmWeb3Service from "./DmmWeb3Service";
import NumberUtil from "../utils/NumberUtil";
import {tokenAddressToTokenMap} from "../models/Tokens";

class DmmTokenService {

  static async getDmmTokens() {
    const controller = new DmmWeb3Service.instance.web3.eth.Contract(DmmController, process.env.REACT_APP_DMM_CONTROLLER);
    const tokenIds = await controller.methods.getDmmTokenIds().call();
    return await tokenIds.reduce(async (map, tokenId) => {
      const underlyingAddress = await controller.methods.dmmTokenIdToUnderlyingTokenAddressMap(tokenId).call();
      const dmmTokenAddress = await controller.methods.dmmTokenIdToDmmTokenAddressMap(tokenId).call();
      const underlying = tokenAddressToTokenMap[underlyingAddress];

      const obj = {
        tokenId,
        address: dmmTokenAddress,
        name: `DMM: ${underlying.symbol}`,
        symbol: `m${underlying.symbol}`,
        decimals: underlying.decimals,
        imageUrl: undefined,
      };
      return {...(await map), [underlyingAddress]: obj};
    }, {});
  }

  static async getExchangeRate(dmmTokenAddress) {
    const dmmToken = new DmmWeb3Service.instance.web3.eth.Contract(DmmToken, dmmTokenAddress);
    return await dmmToken.methods.getCurrentExchangeRate().call()
      .then(exchangeRateString => new NumberUtil.BN(exchangeRateString));
  }

  static async mint(dmmTokenAddress, owner, underlyingAmount) {
    const dmmToken = new DmmWeb3Service.instance.web3.eth.Contract(DmmToken, dmmTokenAddress);
    return await dmmToken.methods.mint(underlyingAmount.toString(10)).send({from: owner});
  }

  static async redeem(dmmTokenAddress, owner, dmmAmount) {
    const dmmToken = new DmmWeb3Service.instance.web3.eth.Contract(DmmToken, dmmTokenAddress);
    return await dmmToken.methods.redeem(dmmAmount.toString(10)).send({from: owner});
  }

}

export default DmmTokenService;