import Button from "@material-ui/core/Button";
import React from "react";

import styles from './DmmToolbar.module.scss';
import DMMLogo from '../../images/dmm-logo.svg';
import DmmWeb3Service from "../../services/DmmWeb3Service";
import CircularProgress from "@material-ui/core/CircularProgress";

class DmmToolbar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
    this.walletChangeUid = DmmWeb3Service.onWalletChange((wallet) => {
      this.setState({address: wallet.address});
    });
  }

  componentWillUnmount() {
    DmmWeb3Service.removeOnWalletChange(this.walletChangeUid);
  }

  loadWallet = async () => {
    this.setState({isLoading: true});
    const result = await DmmWeb3Service.onboard.walletSelect();
    if (result) {
      await DmmWeb3Service.instance.wallet.connect();
    }
    this.setState({isLoading: false});
  };

  render = () => {
    const isWalletLoaded = !!DmmWeb3Service.onboard.getState().address;

    return (
      <div className={styles.navbar}>
        <div className={styles.content}>
          <div className={styles.logoWrapper}>
            <div className={styles.logo}>
              <img src={DMMLogo}/>
            </div>
            <div className={styles.logoText}>
              DMM
            </div>
          </div>
          <div className={styles.connectWalletButton}>
            { this.state.isLoading ? (
              <CircularProgress className={styles.progressBar} color={"inherit"}/>
            ) : (
              <Button className={`${styles.loadWallet} ${isWalletLoaded && styles.loaded}`} onClick={this.loadWallet}>
                {isWalletLoaded ? (
                  <div><div>{'0x' + DmmWeb3Service.onboard.getState().address.substring(2,4) + '...' + DmmWeb3Service.onboard.getState().address.slice(-4)}</div><div className={styles.walletConnected}>Wallet Connected</div></div>
                ) : "Connect Wallet"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

}

export default DmmToolbar;