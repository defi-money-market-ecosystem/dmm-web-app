import * as React from "react";
import Grid from "@material-ui/core/Grid";
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
      underlyingToken: USDC,
      underlyingAllowance: NumberUtil._0,
      dmmAllowance: NumberUtil._0,
      underlyingBalance: NumberUtil._0,
      dmmBalance: NumberUtil._0,
      isMinting: true,
      inputValue: undefined,
      isLoading: false,
    };

    this.pollForData().then(() => {
      console.log("Finished initial poll");
    });

    this.subscriptionId = setInterval(async () => {
      await this.pollForData();
    }, 10000);

    DmmWeb3Service.onWalletChange(() => {
      this.pollForData().then(() => {
        console.log("Finished poll after wallet change");
      });
    });
  }

  onSnackbarClose = () => {
    this.setState({
      snackError: undefined,
      unknownError: undefined,
      snackMessage: undefined,
    })
  };

  doOperation = async () => {
    if (!this.state.inputValue || this.state.inputError) {
      return;
    }

    const underlyingToken = this.state.underlyingToken;
    const dmmToken = this.state.dmmToken;

    const allowance = this.state.isMinting ? this.state.underlyingAllowance : this.state.dmmAllowance;

    this.setState({
      isWaitingForSignature: true,
    });

    let isSetupComplete = true;
    if (allowance.eq(NumberUtil._0)) {
      const tokenToApprove = this.state.isMinting ? underlyingToken : dmmToken;
      isSetupComplete = await ERC20Service.approve(tokenToApprove.address, DmmWeb3Service.walletAddress(), dmmToken.address)
        .on('transactionHash', async transactionHash => {
          this.setState({
            isWaitingForApprovalToMine: true,
          });
          DmmWeb3Service.watchHash(transactionHash);
        })
        .then(async () => {
          const underlyingAllowance = await this.getAllowance(underlyingToken);
          const dmmAllowance = await this.getAllowance(dmmToken);
          this.setState({
            dmmAllowance,
            isWaitingForApprovalToMine: false,
            underlyingAllowance,
          });
          return true;
        })
        .catch((error) => {
          if (error.code === 4001) {
            // User cancelled the txn
            this.setState({
              isWaitingForApprovalToMine: false,
              snackMessage: 'The transaction was cancelled'
            });
          } else if (error) {
            console.error("Approval error: ", error);
            this.setState({
              isWaitingForApprovalToMine: false,
              unknownError: 'An unknown error occurred while interacting with DMM',
            });
          }
          return false;
        });
    }

    if (!isSetupComplete) {
      // If the allowance setting failed. Don't go any further.
      this.setState({
        isWaitingForSignature: false,
      });
      return;
    }

    const receiptPromise = this.state.isMinting ?
      DmmTokenService.mint(dmmToken.address, DmmWeb3Service.walletAddress(), this.state.inputValue)
      :
      DmmTokenService.redeem(dmmToken.address, DmmWeb3Service.walletAddress(), this.state.inputValue);

    const isSuccessful = await receiptPromise
      .on('transactionHash', transactionHash => {
        DmmWeb3Service.watchHash(transactionHash);
        this.setState({
          isWaitingForActionToMine: true,
        });
      })
      .then(() => {
        this.setState({
          isWaitingForActionToMine: false,
        });
        return true;
      })
      .catch(error => {
        if (error.code === 4001) {
          this.setState({
            isWaitingForActionToMine: false,
            snackMessage: 'The transaction was cancelled',
          });
          return false;
        } else {
          console.error("Mint error: ", error);
          this.setState({
            isWaitingForActionToMine: false,
            unknownError: 'An unknown error occurred while interacting with DMM',
          });
          return false;
        }
      });

    this.setState({
      isWaitingForSignature: false,
      value: isSuccessful ? "" : this.state.value,
    });
  };

  getAllowance = async (token) => {
    return await ERC20Service.getAllowance(token.address, DmmWeb3Service.walletAddress(), this.state.dmmToken.address)
      .then(allowanceString => new NumberUtil.BN(allowanceString, 10))
      .catch((e) => {
        console.error("Could not get allowance due to error: ", e);
        this.setState({
          unknownError: `Could not check if ${token.symbol} is enabled due to an unknown error`
        });
        return new NumberUtil.BN('0');
      });
  };

  getBalance = async (token) => {
    return await ERC20Service.getBalance(token.address, DmmWeb3Service.walletAddress())
      .then(balanceString => new NumberUtil.BN(balanceString, 10))
      .catch((e) => {
        console.error("Could not get balance due to error: ", e);
        this.setState({
          unknownError: `Could not check if ${token.symbol} is enabled due to an unknown error`
        });
        return NumberUtil._0;
      });
  };

  switchIsMinting(isMinting) {
    this.setState({
      isMinting,
      value: "",
    });
  };

  componentWillUnmount() {
    clearInterval(this.subscriptionId);
    DmmWeb3Service.removeOnWalletChange(this.walletChangeUid);
  };

  pollForData = async () => {
    if (!DmmWeb3Service.walletAddress()) {
      return;
    }

    if (!this.state.dmmTokensMap) {
      const underlyingToken = this.state.underlyingToken;
      const underlyingToDmmTokensMap = await DmmTokenService.getDmmTokens();
      const dmmToken = underlyingToDmmTokensMap[underlyingToken.address.toLowerCase()];
      const exchangeRate = await DmmTokenService.getExchangeRate(dmmToken.dmmTokenId);
      this.setState({
        dmmToken,
        dmmTokensMap: underlyingToDmmTokensMap,
        exchangeRate,
      });
    }

    const underlyingToken = this.state.underlyingToken;
    const dmmToken = this.state.dmmTokensMap[underlyingToken.address.toLowerCase()];
    const exchangeRate = await DmmTokenService.getExchangeRate(dmmToken.dmmTokenId);

    const underlyingBalance = await this.getBalance(underlyingToken);
    const dmmBalance = await this.getBalance(dmmToken);

    const underlyingAllowance = await this.getAllowance(underlyingToken);
    const dmmAllowance = await this.getAllowance(dmmToken);

    this.setState({
      dmmAllowance,
      dmmBalance,
      underlyingAllowance,
      underlyingBalance,
      exchangeRate,
    });
  };

  loadWallet = async () => {
    this.setState({isLoading: true});
    const result = await DmmWeb3Service.onboard.walletSelect();
    if (result) {
      await DmmWeb3Service.instance.wallet.connect();
    }
    this.setState({isLoading: false});
  };

  render() {
    const isWalletLoaded = !!DmmWeb3Service.onboard.getState().address;

    if (DmmWeb3Service.walletAddress() && this.state.dmmToken) { //TODO - figure out why I need to check for dmmToken when I didn't before
      const token = this.state.isMinting ? this.state.underlyingToken : this.state.dmmToken;
      const allowanceTooltipTitle = this.state.underlyingAllowance.eq(NumberUtil._0) ? `You must first unlock ${token.symbol}` : '';
      const underlyingToken = this.state.underlyingToken;

      const actionText = this.state.isMinting ? `${this.state.dmmToken.symbol} to mint` : `${this.state.dmmToken.symbol} to be redeemed`;
      const tooltip = this.state.isWaitingForApprovalToMine ?
        `Waiting for your ${token.symbol} to be unlock`
        : this.state.isWaitingForActionToMine ? `Waiting for your ${actionText}`
          : `Please confirm the signature`;

      const actionButtonView = this.state.isWaitingForSignature ? (
        <Tooltip title={tooltip}>
          <CircularProgress color={'primary'}/>
        </Tooltip>
      ) : (
        <Tooltip arrow title={allowanceTooltipTitle}>
          <Button onClick={this.doOperation}>
            {this.state.isMinting ? "Mint" : "Redeem"}
          </Button>
        </Tooltip>
      );

      return (
        <div className={styles.swapperWrapper}>
          <SwapPanel
            isMinting={this.state.isMinting}
            underlyingToken={this.state.underlyingToken}
            underlyingBalance={this.state.underlyingBalance}
            dmmBlance={this.state.dmmBalance}
            exchangeRate={this.state.exchangeRate}
            onDoOperation={() => this.doOperation()}
            updateUnderlying={(newToken) => this.setState({ underlyingToken: (newToken === 'USDC' ? USDC : DAI)})}
          />
          <BalancesPanel/>
        </div>
      );
    }
    else {
      return (
        <div className={styles.swapperWrapper}>
          <div className={styles.overlay}>
            <div className={styles.connectWalletButton}>
              <div className={styles.title}>To get started</div>
              { this.state.isLoading ? (
                <CircularProgress className={styles.progressBar} color={"inherit"}/>
              ) : (
                <Button className={`${styles.loadWallet} ${isWalletLoaded && styles.loaded}`} onClick={this.loadWallet}>
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
            isMinting={null}
            underlyingToken={null}
            underlyingBalance={null}
            dmmBlance={null}
            exchangeRate={null}
            disabled
          />
          <BalancesPanel/>
          <Snackbar open={!!this.state.snackError || !!this.state.unknownError || this.state.snackMessage}
                    autoHideDuration={5000}
                    onClose={this.onSnackbarClose}>
            <Alert severity={this.state.snackError || this.state.unknownError ? "error" : "info"}
                   onClose={this.onSnackbarClose}>
              {this.state.snackError || this.state.unknownError || this.state.snackMessage}
            </Alert>
          </Snackbar>
        </div>
      );
    }






      /*return (
        <Grid container>
          <Grid item xs={false} md={1} lg={3} xl={4}/>
          <Grid item xs={12} md={10} lg={6} xl={4}>
            <Paper>
              <Grid container className={styles.standardMargin}>
                <Grid item xs={12}>
                  <h3>You currently are: <b>{this.state.isMinting ? "MINTING" : "REDEEMING"}</b></h3>
                </Grid>
                <Grid item xs={12}>
                  <Button onClick={() => this.switchIsMinting(true)}>Underlying --> DMM</Button>
                  <Button onClick={() => this.switchIsMinting(false)}>DMM --> Underlying</Button>
                </Grid>
              </Grid>
              <div className={styles.standardMargin}>
                <span>{token.symbol} Balance: {this.state.isMinting ? humanize(this.state.underlyingBalance, underlyingToken.decimals) : humanize(this.state.dmmBalance, underlyingToken.decimals)}</span>
                <br/>
                {this.state.exchangeRate ? (
                  <span>Current Exchange Rate {humanize(this.state.exchangeRate, 18, 8)}</span>) : <span/>}
              </div>
              <div className={styles.standardMargin}>
                <TextField
                  id={"input-amount-field"}
                  className={styles.standardMargin}
                  onChange={this.onInputAmountChange}
                  label={`Amount`}
                  variant={"outlined"}
                  error={!!this.state.inputError}
                  helperText={this.state.inputError}
                  type={"text"}
                  value={this.state.value}
                  InputProps={{
                    endAdornment: <InputAdornment position={"end"}>{token.symbol}</InputAdornment>
                  }}
                />
              </div>
              <div className={styles.standardMargin}>
                {actionButtonView}
              </div>
            </Paper>
          </Grid>
          <Snackbar open={!!this.state.snackError || !!this.state.unknownError || this.state.snackMessage}
                    autoHideDuration={5000}
                    onClose={this.onSnackbarClose}>
            <Alert severity={this.state.snackError || this.state.unknownError ? "error" : "info"}
                   onClose={this.onSnackbarClose}>
              {this.state.snackError || this.state.unknownError || this.state.snackMessage}
            </Alert>
          </Snackbar>
        </Grid>
      );

    } else {
      return (
        <div className={styles.overlay}>
          <h3>To get started</h3>
          <h2>Connect your wallet</h2>
          <h4>What is a wallet?</h4>
        </div>
      );
    }*/
  };

}

export default Swapper;