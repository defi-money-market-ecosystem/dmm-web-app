import * as React from 'react';
import NumberUtil, { _0, fromDecimalToBN, humanize } from '../../utils/NumberUtil';
import { tokens } from '../../models/Tokens';
import CountUp from 'react-countup';

import styles from './BalancesPanel.module.scss';
import { CircularProgress } from '@material-ui/core';

import { withTranslations } from '../../services/Translations/Translations';

class BalancesPanel extends React.Component {
  constructor(props) {
    super(props);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.state = {
      width: window.innerWidth,
      lowerWidth: 540,
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
  }

  updateDimensions() {
    this.setState({ width: window.innerWidth });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  mAssetToUnderlyingValueAndLocalize(mAsset, amountBN) {
    // For right now, just return the mAsset to exchange rate value. In the future, like with mETH, we'll need to
    // convert ETH to dollars.
    if (mAsset) {
      const exchangeRate = this.props.symbolToExchangeRateMap
        ? this.props.symbolToExchangeRateMap[mAsset.symbol]
        : null;
      if (exchangeRate) {
        const assetDecimals = mAsset.decimals;
        const maxDecimals = 9;
        // Take the length of the balance to get the number of digits in it, 9 minus that number is how many decimals
        // there should be for it to look good (min 2, max 8)
        const numberOfDecimals = Math.min(
          Math.max(
            maxDecimals -
              Number.parseFloat(humanize(amountBN.mul(exchangeRate).div(NumberUtil._1), assetDecimals))
                .toString()
                .split('.')[0].length,
            2,
          ),
          8,
        );
        const _100Hours = 60 * 60 * 100;
        return (
          <CountUp
            start={
              exchangeRate
                ? Number.parseFloat(humanize(amountBN.mul(exchangeRate).div(NumberUtil._1), assetDecimals, 8))
                : 0
            }
            end={
              exchangeRate
                ? Number.parseFloat(
                    humanize(
                      amountBN
                        .mul(exchangeRate)
                        .div(NumberUtil._1)
                        .add(
                          fromDecimalToBN(0.0007134703196, 18)
                            .mul(amountBN)
                            .div(NumberUtil._1),
                        ),
                      assetDecimals,
                      8,
                    ),
                  )
                : 0
            }
            duration={_100Hours}
            separator=","
            decimals={numberOfDecimals}
            decimal="."
            prefix=""
            suffix=""
          />
        );
      } else {
        return '0';
      }
    } else {
      console.error('Invalid symbol, found: ', mAsset);
      return '0';
    }
  }

  /* TODO - Add US dollar value of assets (specifically m assets, but with ETH it'll also be useful). Will become more useful as the value of m assets and the underlying assets diverge. Can also have a dropdown in the upper right with a choice of currency. */
  render() {
    const assetBalancesViews = tokens
      .filter(token => !token.isHidden)
      .map(underlyingAsset => {
        const mAsset = this.props.dmmTokensMap ? this.props.dmmTokensMap[underlyingAsset.address.toLowerCase()] : null;

        const underlyingBalance =
          this.props.symbolToUnderlyingBalanceMap && this.props.symbolToUnderlyingBalanceMap[underlyingAsset.symbol]
            ? this.props.symbolToUnderlyingBalanceMap[underlyingAsset.symbol]
            : _0;

        const mBalance = this.props.symbolToDmmBalanceMap
          ? this.props.symbolToDmmBalanceMap[underlyingAsset.symbol] || _0
          : _0;

        const decimals = Math.min(underlyingAsset.decimals, 8);

        return (
          <div key={`balanceRow-${underlyingAsset.symbol}`}>
            <div className={styles.balanceRow}>
              <div className={styles.asset}>{underlyingAsset.symbol}</div>
              <div className={styles.amount}>
                {humanize(underlyingBalance, underlyingAsset.decimals, decimals, true, decimals)}
              </div>
            </div>
            <div className={styles.balanceRow}>
              <div className={styles.asset}>m{underlyingAsset.symbol}</div>
              <div className={styles.amount}>
                {humanize(mBalance, underlyingAsset.decimals, decimals, true, decimals)}
                {this.state.width < this.state.lowerWidth ? (
                  <div className={styles.underlyingValue}>
                    ({mAsset ? this.mAssetToUnderlyingValueAndLocalize(mAsset, mBalance) : 0} {underlyingAsset.symbol})
                  </div>
                ) : (
                  <span className={styles.underlyingValue}>
                    &nbsp;({mAsset ? this.mAssetToUnderlyingValueAndLocalize(mAsset, mBalance) : 0}{' '}
                    {underlyingAsset.symbol})
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      });

    const heightPerToken = this.state.width > this.state.lowerWidth ? 84 : 112;
    const height = tokens.length * heightPerToken + 64;

    return (
      <div className={`${styles.BalancesPanel} ${this.props.disabled && styles.disabled}`} style={{ height }}>
        <div className={styles.title}>
          {this.props.excerpt('balances.title', this.props.language)}
          {this.props.isLoading ? <CircularProgress className={styles.balanceLoadingProgress} /> : <span />}
        </div>
        <div className={styles.bottomBorder} />
        <div className={styles.title}></div>
        {assetBalancesViews}
      </div>
    );
  }
}

export default withTranslations(BalancesPanel);
