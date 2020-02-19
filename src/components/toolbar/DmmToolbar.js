import {Button, Toolbar} from "@material-ui/core";
import AppBar from "@material-ui/core/AppBar";
import React from "react";

import styles from './DmmToolbar.module.scss';
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
    let button;
    if (this.state.isLoading) {
      button = (
        <CircularProgress className={styles.progressBar} color={"inherit"}/>
      );
    } else {
      button = (
        <Button className={styles.loadWallet} onClick={this.loadWallet}>
          {isWalletLoaded ? DmmWeb3Service.onboard.getState().address : "Load Wallet"}
        </Button>
      );
    }

    return (
      <AppBar position="static">
        <Toolbar className={styles.toolbar}>
          {button}
        </Toolbar>
      </AppBar>
    );
  };

}

export default DmmToolbar;