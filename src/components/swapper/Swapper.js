import * as React from "react";
import {CircularProgress, Paper, TextField} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import DmmWeb3Service from "../../services/DmmWeb3Service";
import {USDC, DAI} from "../../models/Tokens";
import {humanize} from "../../utils/NumberUtil";

import styles from "./Swapper.module.scss";
import ERC20Service from "../../services/ERC20Service";
import DmmTokenService from "../../services/DmmTokenService";
import Tooltip from "@material-ui/core/Tooltip";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import NumberUtil from "../../utils/NumberUtil";
import {fromDecimalToBN} from "../../utils/NumberUtil";
import InputAdornment from "@material-ui/core/InputAdornment";
import SwapPanel from '../SwapPanel/SwapPanel';
import BalancesPanel from '../BalancesPanel/BalancesPanel';


class Swapper extends React.Component {
  constructor(props) {
    super(props);

    this.state = {

    };
  }


  render() {
    const isWalletLoaded = !!DmmWeb3Service.onboard.getState().address;
    console.log('PROPS');
    console.log(this.props);

    if (DmmWeb3Service.walletAddress() && this.props.dmmToken) {
      const token = this.props.isMinting ? this.props.underlyingToken : this.props.dmmToken;
      const allowanceTooltipTitle = this.props.underlyingAllowance.eq(NumberUtil._0) ? `You must first unlock ${token.symbol}` : '';
      const underlyingToken = this.props.underlyingToken;

      const actionText = this.props.isMinting ? `${this.props.dmmToken.symbol} to mint` : `${this.props.dmmToken.symbol} to be redeemed`;
      const tooltip = this.state.isWaitingForApprovalToMine ?
        `Waiting for your ${token.symbol} to be unlock`
        : this.props.isWaitingForActionToMine ? `Waiting for your ${actionText}`
          : `Please confirm the signature`;

      const actionButtonView = this.props.isWaitingForSignature ? (
        <Tooltip title={tooltip}>
          <CircularProgress color={'primary'}/>
        </Tooltip>
      ) : (
        <Tooltip arrow title={allowanceTooltipTitle}>
          <Button onClick={this.doOperation}>
            {this.props.isMinting ? "Mint" : "Redeem"}
          </Button>
        </Tooltip>
      );

      return (
        <div className={styles.swapperWrapper}>
          <SwapPanel
            isMinting={this.props.isMinting}
            isWaitingForSignature={this.props.isWaitingForSignature}
            underlyingToken={this.props.underlyingToken}
            underlyingAllowance={this.props.underlyingAllowance}
            underlyingBalance={this.props.underlyingBalance}
            dmmToken={this.props.dmmToken}
            dmmBalance={this.props.dmmBalance}
            dmmAllowance={this.props.dmmAllowance}
            exchangeRate={this.props.exchangeRate}
            onDoOperation={() => this.props.doOperation()}
            updateUnderlying={(newToken) => this.props.updateUnderlying(newToken)}
            updateValue={(val) => this.props.updateValue(val)}
            setIsMinting={(val) => this.props.setIsMinting(val)}
          />
          <BalancesPanel
            daiBalance={this.props.daiBalance}
            usdcBalance={this.props.usdcBalance}
            mdaiBalance={this.props.mdaiBalance}
            musdcBalance={this.props.musdcBalance}
            dmmToken={this.props.dmmToken}
            underlyingToken={this.props.underlyingToken}
            mdaiToken={this.props.mdaiToken}
            musdcToken={this.props.musdcToken}
            exchangeRate={this.props.exchangeRate}
          />
        </div>
      );
    }
    else {
      return (
        <div className={styles.swapperWrapper}>
          <div className={styles.overlay}>
            <div className={styles.connectWalletButton}>
              <div className={styles.title}>To get started</div>
              { this.props.isLoading ? (
                <CircularProgress className={styles.progressBar} color={"inherit"}/>
              ) : (
                <Button className={`${styles.loadWallet} ${isWalletLoaded && styles.loaded}`} onClick={() => this.props.loadWallet()}>
                  {isWalletLoaded ? (
                    "Wallet Loaded"
                  ) : "Connect Your Wallet"}
                </Button>
              )}
              <Tooltip title={'DMM tokens exist on the Ethereum blockchain. To hold, swap, or transfer DMM tokens you require an Ethereum wallet. MetaMask is a good option that works with most browsers'}>
                <div className={styles.whatsAWallet}><div className={styles.questionIcon}>?</div><div className={styles.helperText}>What's a wallet?</div></div>
              </Tooltip>
            </div>
          </div>
          <SwapPanel
            isMinting={true}
            underlyingToken={null}
            underlyingBalance={null}
            dmmBlance={null}
            exchangeRate={null}
            disabled
          />
          <BalancesPanel
            daiBalance={this.props.daiBalance}
            usdcBalance={this.props.usdcBalance}
            mdaiBalance={this.props.mdaiBalance}
            musdcBalance={this.props.musdcBalance}
            dmmToken={this.props.dmmToken}
            underlyingToken={this.props.underlyingToken}
            mdaiToken={this.props.mdaiToken}
            musdcToken={this.props.musdcToken}
            exchangeRate={null}
            disabled
          />
        </div>
      );
    }
  };
}

export default Swapper;