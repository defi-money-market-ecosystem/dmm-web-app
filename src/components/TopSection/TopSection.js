import React from 'react';
import CountUp from 'react-countup';
import NumberUtil, {fromDecimalToBN, humanize} from "../../utils/NumberUtil";

import styles from './TopSection.module.scss';

class TopSection extends React.Component {

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
                {humanize(this.props.totalTokensPurchased, 18, 0, true)}
              </div>
              <div className={styles.statSubtitle}>
                mTokens Purchased
              </div>
            </div>
          </div>
          <div className={styles.rightStat}>
            {/* 0.0000001981862 per second */}
            <div className={styles.aprWrapper}>
              Earning 6.25% APR
            </div>
            <div className={styles.daiSection}>
              <div className={styles.usdToDmm}>
                <div className={styles.daiInterestRate}>
                  <span className={styles.bold}>1</span>
                  <span className={styles.light}>&nbsp;mDAI =&nbsp;</span>
                  <CountUp
                    start={this.props.daiRate ? Number.parseFloat(humanize(NumberUtil._1.mul(this.props.daiRate).div(NumberUtil._1),18)) : 0}
                    end={this.props.daiRate ? Number.parseFloat(humanize(NumberUtil._1.mul(this.props.daiRate).div(NumberUtil._1).add(fromDecimalToBN(0.0007134703196,18)),18)) : 0}
                    duration={60 * 60 * 100}
                    separator=" "
                    decimals={8}
                    decimal="."
                    prefix=""
                    suffix=""
                  />
                  <span className={styles.light}>&nbsp;DAI</span>
                </div>
              </div>
              <div className={styles.usdToDmm}>
                <div className={styles.daiInterestRate}>
                  <span className={styles.bold}>1</span>
                  <span className={styles.light}>&nbsp;DAI =&nbsp;</span>
                  <CountUp
                    start={this.props.daiRate ? Number.parseFloat(humanize(NumberUtil._1.mul(NumberUtil._1).div(this.props.daiRate),18)) : 0}
                    end={this.props.daiRate ? Number.parseFloat(humanize(NumberUtil._1.mul(NumberUtil._1).div(this.props.daiRate).sub(fromDecimalToBN(0.0006715014772,18)),18)) : 0}
                    duration={60 * 60 * 100}
                    separator=" "
                    decimals={8}
                    decimal="."
                    prefix=""
                    suffix=""
                  />
                  <span className={styles.light}>&nbsp;mDAI</span>
                </div>
              </div>
            </div>
            <div className={styles.usdcSection}>
              <div className={styles.usdToDmm}>
                <div className={styles.daiInterestRate}>
                  <span className={styles.bold}>1</span>
                  <span className={styles.light}>&nbsp;mUSDC =&nbsp;</span>
                  <CountUp
                    start={this.props.usdcRate ? Number.parseFloat(humanize(NumberUtil._1.mul(this.props.usdcRate).div(NumberUtil._1),18)) : 0}
                    end={this.props.usdcRate ? Number.parseFloat(humanize(NumberUtil._1.mul(this.props.usdcRate).div(NumberUtil._1).add(fromDecimalToBN(0.0007134703196,18)),18)) : 0}
                    duration={60 * 60 * 100}
                    separator=" "
                    decimals={8}
                    decimal="."
                    prefix=""
                    suffix=""
                  />
                  <span className={styles.light}>&nbsp;USDC</span>
                </div>
              </div>
              <div className={styles.usdToDmm}>
                <div className={styles.daiInterestRate}>
                  <span className={styles.bold}>1</span>
                  <span className={styles.light}>&nbsp;USDC =&nbsp;</span>
                  <CountUp
                    start={this.props.usdcRate ? Number.parseFloat(humanize(NumberUtil._1.mul(NumberUtil._1).div(this.props.usdcRate),18)) : 0}
                    end={this.props.usdcRate ? Number.parseFloat(humanize(NumberUtil._1.mul(NumberUtil._1).div(this.props.usdcRate).sub(fromDecimalToBN(0.0006715014772,18)),18)) : 0}
                    duration={60 * 60 * 100}
                    separator=" "
                    decimals={8}
                    decimal="."
                    prefix=""
                    suffix=""
                  />
                  <span className={styles.light}>&nbsp;mUSDC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TopSection;
