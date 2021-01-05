import Button from '@material-ui/core/Button';
import React from 'react';
import FiatAdapter from 'fiat-adapter';

import styles from './DmmToolbar.module.scss';
import DMMLogo from '../../images/dmm-logo.svg';
import DmmWeb3Service from '../../services/DmmWeb3Service';
import CircularProgress from '@material-ui/core/CircularProgress';
import { DAI, USDC } from '../../models/Tokens';

import { withTranslations } from '../../services/Translations/Translations';

class DmmToolbar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      fiatAdapterOpen: false,
    };

    this.walletChangeUid = DmmWeb3Service.onWalletChange((wallet) => {
      this.setState({ address: wallet ? wallet.address : undefined });
    });
  }

  componentWillUnmount() {
    DmmWeb3Service.removeOnWalletChange(this.walletChangeUid);
  }

  render() {
    const isWalletLoaded = !!DmmWeb3Service.onboard.getState().address;

    return (
      <div className={styles.navbar}>
        <div className={styles.content}>
          <div className={styles.logoWrapper}>
            <div className={styles.logo}>
              <img src={DMMLogo} alt={'DMM Logo'}/>
            </div>
            <div className={styles.logoText}>
              DMM <span className={styles.swapText}>Swap</span>
            </div>
          </div>
          <div className={styles.buttonsWrapper}>
            {/*<div className={styles.purchaseCryptoButton}>
              <Button className={styles.loadWallet} onClick={() => this.setState({ fiatAdapterOpen: true })}>
                Buy Crypto
              </Button>
            </div>*/}
            <div className={styles.connectWalletButton}>
              {this.state.isLoading ? (
                <CircularProgress className={styles.progressBar} color={'inherit'}/>
              ) : (
                <Button className={`${styles.loadWallet} ${isWalletLoaded && styles.loaded}`}
                        onClick={() => this.props.loadWallet()}>
                  {isWalletLoaded ? (
                    <div>
                      <div>{'0x' + DmmWeb3Service.onboard.getState().address.substring(2, 4) + '...' + DmmWeb3Service.onboard.getState().address.slice(-4)}</div>
                      <div className={styles.walletConnected}>{ this.props.excerpt('navbar.walletConnected', this.props.language) }</div>
                    </div>
                  ) : this.props.excerpt('navbar.connectWallet', this.props.language)}
                </Button>
              )}
            </div>
          </div>
        </div>
        <FiatAdapter
          open={this.state.fiatAdapterOpen}
          onClose={() => this.setState({ fiatAdapterOpen: false })}
          allowedCryptos={[DAI.symbol, USDC.symbol]}
        />
      </div>
    );
  };

}

export default withTranslations(DmmToolbar);