import React from 'react';
import CountUp from 'react-countup';
import NumberUtil, {fromDecimalToBN, humanize} from "../../utils/NumberUtil";

import styles from './TopSection.module.scss';
import {CircularProgress} from "@material-ui/core";

class TopSection extends React.Component {

  render() {
    return (
      <div className={styles.TopBar}>
        <div className={styles.content}>
          <div className={styles.leftStats}>
            <div className={styles.totalStat}>
              <div className={styles.bigNum}>
                {
                  this.props.totalTokensPurchased.eq(new NumberUtil.BN(0)) ?
                    (<div className={styles.totalTokensPurchasedLoader}><CircularProgress/></div>) :
                    (<span>
                      ${humanize(this.props.totalTokensPurchased, 18, 0, true)}
                    </span>)
                }
              </div>
              <div className={styles.statSubtitle}>
                Worth of mTokens Purchased
              </div>
            </div>
          </div>
          <div className={styles.rightStat}>
            {/* 0.0000001981862 per second */}
            <div className={styles.aprWrapper}>
              Earning 6.25% APY
            </div>
            <div>
              {this.props.tokens.map(token => {
                const lowerSymbol = token.symbol.toLowerCase();
                const exchangeRate = this.props.symbolToExchangeRateMap
                  ? this.props.symbolToExchangeRateMap[`m${token.symbol}`]
                  : undefined;

                return (
                  <div className={styles[`${lowerSymbol}Section`]}>
                    <div className={styles.usdToDmm}>
                      <div className={styles[`${lowerSymbol}InterestRate`]}>
                        <span className={styles.bold}>1</span>
                        <span className={styles.light}>&nbsp;m{token.symbol} =&nbsp;</span>
                        <CountUp
                          start={exchangeRate ? Number.parseFloat(humanize(NumberUtil._1.mul(exchangeRate).div(NumberUtil._1), 18)) : 0}
                          end={exchangeRate ? Number.parseFloat(humanize(NumberUtil._1.mul(exchangeRate).div(NumberUtil._1).add(fromDecimalToBN(0.0007134703196, 18)), 18)) : 0}
                          duration={60 * 60 * 100}
                          separator=" "
                          decimals={8}
                          decimal="."
                          prefix=""
                          suffix=""
                        />
                        <span className={styles.light}>&nbsp;{token.symbol}</span>
                      </div>
                    </div>
                    <div className={styles.usdToDmm}>
                      <div className={styles[`${lowerSymbol}InterestRate`]}>
                        <span className={styles.bold}>1</span>
                        <span className={styles.light}>&nbsp;{token.symbol} =&nbsp;</span>
                        <CountUp
                          start={exchangeRate ? Number.parseFloat(humanize(NumberUtil._1.mul(NumberUtil._1).div(exchangeRate), 18)) : 0}
                          end={exchangeRate ? Number.parseFloat(humanize(NumberUtil._1.mul(NumberUtil._1).div(exchangeRate).sub(fromDecimalToBN(0.0006715014772, 18)), 18)) : 0}
                          duration={60 * 60 * 100}
                          separator=" "
                          decimals={8}
                          decimal="."
                          prefix=""
                          suffix=""
                        />
                        <span className={styles.light}>&nbsp;m{token.symbol}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TopSection;
