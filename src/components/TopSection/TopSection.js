import React from 'react';
import CountUp from 'react-countup';
import NumberUtil, { fromDecimalToBN, humanize } from '../../utils/NumberUtil';

import styles from './TopSection.module.scss';
import { CircularProgress } from '@material-ui/core';
import styled, { keyframes } from 'styled-components';
import { tokens } from '../../models/Tokens';

import { withTranslations } from '../../services/Translations/Translations';

const TokenWrappers = tokens.map((token, index, allTokens) => {
  const totalDuration = allTokens.length * 8;
  const delay = index * 8;
  const percentageSplit = 100 / allTokens.length

  const fadeAnimation = keyframes`
    0% { 
      opacity: 0; 
    }
    2% { 
      opacity: 1; 
    }
    ${percentageSplit}% { 
      opacity: 1; 
    }
    ${percentageSplit + 2}% { 
      opacity: 0; 
    }
    100% { 
      opacity: 0; 
    }
  `

  return styled.div`
    animation: ${fadeAnimation} ${totalDuration}s ${delay}s infinite;
  `
})

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
                { this.props.excerpt('header.totalmTokens', this.props.language) }
              </div>
            </div>
          </div>
          <div className={styles.rightStat}>
            {/* 0.0000001981862 per second */}
            <div className={styles.aprWrapper}>
              { this.props.excerpt('header.earning', this.props.language) }
            </div>
            <div>
              {this.props.tokens.map((token, index) => {
                const exchangeRate = this.props.symbolToExchangeRateMap
                  ? this.props.symbolToExchangeRateMap[`m${token.symbol}`]
                  : undefined;

                const TokenWrapper = TokenWrappers[index];

                return (
                  <TokenWrapper className={styles.section} key={`header-${token.symbol}`}>
                    <div className={styles.usdToDmm}>
                      <div className={styles.interestRate}>
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
                      <div className={styles.interestRate}>
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
                  </TokenWrapper>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTranslations(TopSection);
