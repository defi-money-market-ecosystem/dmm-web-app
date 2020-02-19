import Web3 from 'web3'

export const BN = Web3.utils.BN;

export const _0 = new BN(0);
export const _10 = new BN(10);
export const humanPrecision = 6;

export const MAX_UINT256 = new BN('2').pow(new BN('256')).sub(new BN('1'));
export const MAX_INT256 = new BN('2').pow(new BN('255')).sub(new BN('1'));
export const MIN_INT256 = new BN('2').pow(new BN('255')).mul(new BN('-1'));

export const humanize = (bn, bnPrecision, targetPrecision) => {
  if (typeof bn === 'number') {
    bn = new BN(bn);
  } else if (typeof bn === 'string') {
    bn = new BN(bn);
  }

  if (!targetPrecision) {
    targetPrecision = humanPrecision;
  }

  if (!bnPrecision) {
    bnPrecision = 18;
  }
  const truncationAmount = Math.max(bnPrecision - targetPrecision, 0);
  if (truncationAmount === 0) {
    return Web3.utils.fromWei(bn.mul(new BN(_10).pow(new BN(18 - bnPrecision))));
  }

  const baseRate = new BN(_10).pow(new BN(bnPrecision - targetPrecision));
  return Web3.utils.fromWei(bn.div(baseRate).mul(baseRate));
};

export const fromDecimalToBN = (value, bnPrecision) => {
  if (typeof value === 'number') {
    value = value + '';
  }

  const bn = new BN(Web3.utils.toWei(value));
  if (bnPrecision && bnPrecision !== 18) {
    return bn.div(_10.pow(new BN(18 - bnPrecision)));
  } else {
    return bn;
  }
};

Number.prototype.countDecimals = function () {
  if (Math.floor(this.valueOf()) === this.valueOf()) return 0;
  const string = this.toString();
  if (string.includes('e-')) {
    return Number.parseInt(string.substring(string.indexOf('e-') + 2));
  } else {
    return string.split(".")[1].length || 0;
  }
};

export default {
  _0,
  BN,
  MAX_UINT256,
  MAX_INT256,
  MIN_INT256,
};