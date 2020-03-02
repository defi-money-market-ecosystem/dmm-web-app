import * as React from "react";
import {humanize} from "../../utils/NumberUtil";
import {USDC, DAI} from "../../models/Tokens";

import styles from "./BalancesPanel.module.scss";
import NumberUtil from "../../utils/NumberUtil";

class BalancesPanel extends React.Component {

  mAssetToDollarValueAndLocalize = (mAsset, amountBN) => {
    // For right now, just return the mAsset to exchange rate value. In the future, like with mETH, we'll need to
    // convert ETH to dollars.

    let bnValue;
    if (mAsset.symbol === this.props.mDaiToken.symbol) {
      bnValue = amountBN.mul(this.props.mDaiExchangeRate).div(NumberUtil._1);
    } else if (mAsset.symbol === this.props.mUsdcToken.symbol) {
      bnValue = amountBN.mul(this.props.mUsdcExchangeRate).div(NumberUtil._1);
    } else {
      console.error("Invalid symbol, found: ", mAsset.symbol);
      return '0';
    }

    return parseFloat(humanize(bnValue, mAsset.decimals, 0)).toLocaleString("en-US", {minimumFractionDigits: 0, maximumFractionDigits: 0})
  };

  /* TODO - Add US dollar value of assets (specifically m assets, but with ETH it'll also be useful). Will become more useful as the value of m assets and the underlying assets diverge. Can also have a dropdown in the upper right with a choice of currency. */
  render = () => {
    const mAssets = [this.props.mDaiToken, this.props.mUsdcToken];
    const underlyingAssets = [DAI, USDC];
    const underlyingBalances = [this.props.daiBalance, this.props.usdcBalance];
    const mBalances = [this.props.mDaiBalance, this.props.mUsdcBalance];

    const assetBalancesViews = underlyingAssets.map((underlyingAsset, index) => {
      const mAsset = mAssets[index];
      const underlyingBalance = underlyingBalances[index];
      const mBalance = mBalances[index];
      const decimals = Math.min(underlyingAsset.decimals, 8);
      return (
        <>
          <div className={styles.balanceRow}>
            <div className={styles.asset}>
              {underlyingAsset.symbol}
            </div>
            <div className={styles.amount}>
              {underlyingBalance ? parseFloat(humanize(underlyingBalance, underlyingAsset.decimals)).toLocaleString("en-US", {minimumFractionDigits: decimals}) : 0}
            </div>
          </div>
          <div className={styles.balanceRow}>
            <div className={styles.asset}>
              m{underlyingAsset.symbol}
            </div>
            <div className={styles.amount}>
              {mBalance ? parseFloat(humanize(mBalance, underlyingAsset.decimals)).toLocaleString("en-US", {minimumFractionDigits: decimals}) : 0}
              <span className={styles.underlyingValue}>
                &nbsp;({ mAsset ? this.mAssetToDollarValueAndLocalize(mAsset, mBalance) : 0} {underlyingAsset.symbol})
              </span>
            </div>
          </div>
        </>
      );
    });

    return (
      <div className={`${styles.BalancesPanel} ${this.props.disabled && styles.disabled}`}>
        <div className={styles.title}>
          Balances
        </div>
        <div className={styles.bottomBorder}/>
        <div className={styles.titleRow}>
        </div>
        {assetBalancesViews}
      </div>
    );
  };
}

export default BalancesPanel;