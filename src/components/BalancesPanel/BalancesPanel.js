import * as React from "react";
import {humanize} from "../../utils/NumberUtil";
import {USDC, DAI} from "../../models/Tokens";

import styles from "./BalancesPanel.module.scss";

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
    return (
      <div className={styles.BalancesPanel}>
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
            { this.props.underlyingToken ? BalancesPanel.numberWithCommas(humanize(this.props.daiBalance, DAI.decimals)) : 0/* TODO - likely want to change this to use the decmials for each token */ }
          </div>
        </div>
        <div className={styles.balanceRow}>
          <div className={styles.asset}>
            mDai
          </div>
          <div className={styles.amount}>
            { this.props.mdaiToken ? BalancesPanel.numberWithCommas(humanize(this.props.mdaiBalance, this.props.mdaiToken.decimals)) : 0 }
          </div>
        </div>
        <div className={styles.balanceRow}>
          <div className={styles.asset}>
            USDC
          </div>
          <div className={styles.amount}>
            { this.props.underlyingToken ? BalancesPanel.numberWithCommas(humanize(this.props.usdcBalance, USDC.decimals)) : 0 }
          </div>
        </div>
        <div className={styles.balanceRow}>
          <div className={styles.asset}>
            mUSDC
          </div>
          <div className={styles.amount}>
            { this.props.musdcToken ? BalancesPanel.numberWithCommas(humanize(this.props.musdcBalance, this.props.musdcToken.decimals)) : 0 }
          </div>
        </div>
      </div>
    );
  };
}

export default BalancesPanel;