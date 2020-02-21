import DmmToken from "../abi/DmmToken";
import DmmWeb3Service from "./DmmWeb3Service";
import NumberUtil from "../utils/NumberUtil";
import Index from "./index";

class DmmTokenService {

  static async getDmmTokens() {
    const response = await fetch(
      `${Index.baseUrl}/v1/dmm/tokens`,
      {headers: {'Accept': 'application/json'}},
    );
    const tokens = (await response.json())["data"];
    return tokens.reduce((map, token) => {
      token.dmmTokenId = token["dmm_token_id"];
      token.address = token["dmm_token_address"];
      token.imageUrl = token["image_url"];
      token.underlyingTokenAddress = token["underlying_token_address"];
      return {...map, [token.underlyingTokenAddress]: token};
    }, {});
  }

  static async getExchangeRate(dmmTokenId) {
    const response = await fetch(
      `${Index.baseUrl}/v1/dmm/tokens/${dmmTokenId.toString(10)}/exchange-rate`,
      {headers: {'Accept': 'application/json'}},
    );
    return new NumberUtil.BN((await response.json())["data"]["exchange_rate"]);
  }

  static mint(dmmTokenAddress, owner, underlyingAmount) {
    const dmmToken = new DmmWeb3Service.instance.web3.eth.Contract(DmmToken, dmmTokenAddress);
    return dmmToken.methods.mint(underlyingAmount.toString(10)).send({from: owner});
  }

  static redeem(dmmTokenAddress, owner, dmmAmount) {
    const dmmToken = new DmmWeb3Service.instance.web3.eth.Contract(DmmToken, dmmTokenAddress);
    return dmmToken.methods.redeem(dmmAmount.toString(10)).send({from: owner});
  }

}

export default DmmTokenService;