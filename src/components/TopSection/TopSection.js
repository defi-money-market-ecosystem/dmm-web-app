import React from 'react';
import CountUp from 'react-countup';

import styles from './TopSection.module.scss';

class TopSection extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={styles.TopBar}>
        <div className={styles.content}>
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
                <span className={styles.bold}>1</span><span className={styles.light}> DAI</span><span className={styles.small}>/</span><span className={styles.light}>USDC = </span>
                <CountUp
                  start={1.01425}
                  end={1.01425 + 0.000007134703196}
                  duration={60 * 60}
                  separator=" "
                  decimals={8}
                  decimal="."
                  prefix=""
                  suffix=""
                /><span className={styles.light}> DMM</span>
              </div>
            </div>
            <div className={styles.usdToDmm}>
              <div className={styles.daiInterestRate}>
                <span className={styles.bold}>1 </span><span className={styles.light}>DMM = </span>
                <CountUp
                  start={0.99452}
                  end={0.99452 - 0.000006715014772}
                  duration={60 * 60}
                  separator=" "
                  decimals={8}
                  decimal="."
                  prefix=""
                  suffix=""
                /><span className={styles.light}> DAI</span><span className={styles.small}>/</span><span className={styles.light}>USDC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TopSection;
