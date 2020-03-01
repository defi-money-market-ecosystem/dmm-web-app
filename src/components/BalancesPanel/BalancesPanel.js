import * as React from "react";
import {fromDecimalToBN, humanize} from "../../utils/NumberUtil";
import {USDC, DAI} from "../../models/Tokens";

import styles from "./BalancesPanel.module.scss";
import SwapPanel from "../SwapPanel/SwapPanel";
import NumberUtil from "../../utils/NumberUtil";

class BalancesPanel extends React.Component {
  constructor(props) {
    super(props);

  }

  static numberWithCommas(x) {
    const parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  /* TODO - Add US dollar value of assets (specifically m assets, but with ETH it'll also be useful). Will become more useful as the value of m assets and the underlying assets diverge. Can also have a dropdown in the upper right with a choice of currency. */
  render() {
    if (this.props.musdcToken) {
      console.log('GOT');
      console.log(this.props.musdcBalance);
      console.log(''+this.props.musdcBalance);
      console.log(humanize(this.props.musdcBalance, this.props.musdcToken.decimals));
      console.log(humanize(this.props.musdcBalance, this.props.musdcToken.decimals, 4));
    }

    return (
      <div className={`${styles.BalancesPanel} ${this.props.disabled && styles.disabled}`}>
        <div className={styles.title}>
          Balances
        </div>
        <div className={styles.bottomBorder}/>
        <div className={styles.titleRow}>
        </div>
        <div className={styles.balanceRow}>
          <div className={styles.asset}>
            DAI
          </div>
          <div className={styles.amount}>
            { this.props.underlyingToken ? BalancesPanel.numberWithCommas(parseFloat(humanize(this.props.daiBalance, DAI.decimals)).toFixed(4)) : 0/* TODO - likely want to change this to use the decmials for each token */ }
          </div>
        </div>
        <div className={styles.balanceRow}>
          <div className={styles.asset}>
            mDAI
          </div>
          <div className={styles.amount}>
            { this.props.mdaiToken ? BalancesPanel.numberWithCommas(parseFloat(humanize(this.props.mdaiBalance, this.props.mdaiToken.decimals)).toFixed(4)) : 0 } <span className={styles.underlyingValue}>({ this.props.mdaiToken ? SwapPanel.numberWithCommas(humanize(this.props.mdaiBalance.mul(this.props.exchangeRate).div(NumberUtil._1), DAI.decimals, 2)) : 0} DAI)</span>
          </div>
        </div>
        <div className={styles.balanceRow}>
          <div className={styles.asset}>
            USDC
          </div>
          <div className={styles.amount}>
            { this.props.underlyingToken ? BalancesPanel.numberWithCommas(parseFloat(humanize(this.props.usdcBalance, USDC.decimals)).toFixed(4)) : 0 }
          </div>
        </div>
        <div className={styles.balanceRow}>
          <div className={styles.asset}>
            mUSDC
          </div>
          <div className={styles.amount}>
            { this.props.musdcToken ? BalancesPanel.numberWithCommas(parseFloat(humanize(this.props.musdcBalance, this.props.musdcToken.decimals)).toFixed(4)) : 0 } <span className={styles.underlyingValue}>({ this.props.musdcToken ? SwapPanel.numberWithCommas(parseFloat(humanize(this.props.musdcBalance.mul(this.props.exchangeRate).div(NumberUtil._1), USDC.decimals)).toFixed(2)) : 0} USDC)</span>
          </div>
        </div>
      </div>
    );
  };
}

export default BalancesPanel;