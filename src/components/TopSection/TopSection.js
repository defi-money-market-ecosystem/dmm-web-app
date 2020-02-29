import React from 'react';
import CountUp from 'react-countup';
import NumberUtil, {fromDecimalToBN, humanize} from "../../utils/NumberUtil";

import styles from './TopSection.module.scss';

class TopSection extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={styles.TopBar}>
        <div className={styles.content}>
          {/*<div className={styles.title}>
            DMM Swap TODO - replace this by changing text in upper left on navbar
          </div>*/}
          <div className={styles.leftStats}>
            <div className={styles.totalStat}>
              <div className={styles.bigNum}>
                1,436,725
              </div>
              <div className={styles.statSubtitle}>
                DMM Purchased
              </div>
            </div>
          </div>
          <div className={styles.rightStat}>
            {/* 0.0000001981862 per second */}
            <div className={styles.aprWrapper}>
              Earning 6.25% APR
            </div>
            <div className={styles.usdToDmm}>
              <div className={styles.daiInterestRate}>
                <span className={styles.bold}>1 </span><span className={styles.light}>mDAI/mUSDC = </span>
                <CountUp
                  start={this.props.exchangeRate ? humanize(NumberUtil._1.mul(this.props.exchangeRate).div(NumberUtil._1),18) : 0}
                  end={this.props.exchangeRate ? humanize(NumberUtil._1.mul(this.props.exchangeRate).div(NumberUtil._1).add(fromDecimalToBN(0.000007134703196,18)),18) : 0}
                  duration={60 * 60}
                  separator=" "
                  decimals={8}
                  decimal="."
                  prefix=""
                  suffix=""
                /><span className={styles.light}> DAI</span><span className={styles.small}>/</span><span className={styles.light}>USDC</span>
              </div>
            </div>
            <div className={styles.usdToDmm}>
              <div className={styles.daiInterestRate}>
                <span className={styles.bold}>1</span><span className={styles.light}> DAI</span><span className={styles.small}>/</span><span className={styles.light}>USDC = </span>
                <CountUp
                  start={this.props.exchangeRate ? humanize(NumberUtil._1.mul(NumberUtil._1).div(this.props.exchangeRate),18) : 0}
                  end={this.props.exchangeRate ? humanize(NumberUtil._1.mul(NumberUtil._1).div(this.props.exchangeRate).sub(fromDecimalToBN(0.000006715014772,18)),18) : 0}
                  duration={60 * 60}
                  separator=" "
                  decimals={8}
                  decimal="."
                  prefix=""
                  suffix=""
                /><span className={styles.light}> DMM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TopSection;
