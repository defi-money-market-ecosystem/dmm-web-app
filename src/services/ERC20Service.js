import IERC20 from "../abi/IERC20";
import DmmWeb3Service from "./DmmWeb3Service";
import NumberUtil from "../utils/NumberUtil";
import {WETH} from "../models/Tokens";

class ERC20Service {

  static async getAllowance(tokenAddress, owner, spender) {
    if (tokenAddress.toLowerCase() === WETH.address.toLowerCase()) {
      return new NumberUtil.BN("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    }

    const token = new DmmWeb3Service.instance.web3.eth.Contract(IERC20, tokenAddress);
    return await token.methods.allowance(owner, spender).call()
      .then(allowanceString => new NumberUtil.BN(allowanceString));
  }

  static async getBalance(tokenAddress, owner) {
    if (tokenAddress.toLowerCase() === WETH.address.toLowerCase()) {
      return await DmmWeb3Service.instance.web3.eth.getBalance(owner)
        .then(balanceString => new NumberUtil.BN(balanceString));
    }

    const token = new DmmWeb3Service.instance.web3.eth.Contract(IERC20, tokenAddress);
    return await token.methods.balanceOf(owner).call()
      .then(balanceString => new NumberUtil.BN(balanceString));
  }

  static approve(tokenAddress, owner, spender) {
    const token = new DmmWeb3Service.instance.web3.eth.Contract(IERC20, tokenAddress);
    return token.methods.approve(spender, NumberUtil.MAX_UINT256.toString(10)).send({from: owner});
  }

}

export default ERC20Service;