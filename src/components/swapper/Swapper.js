import * as React from "react";
import Grid from "@material-ui/core/Grid";
import {CircularProgress, Paper, TextField} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import DmmWeb3Service from "../../services/DmmWeb3Service";
import {USDC} from "../../models/Tokens";
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
    };

    this.pollForData().then(() => {
      console.log("Finished initial poll")
    });

    this.subscriptionId = setInterval(async () => {
      await this.pollForData();
    }, 10000);

    DmmWeb3Service.onWalletChange(() => {
      this.pollForData().then(() => {
        console.log("Finished poll after wallet change")
      });
    })
  }

  onSnackbarClose = () => {
    this.setState({
      snackError: undefined,
      unknownError: undefined,
      snackMessage: undefined,
    })
  };

  onInputAmountChange = (event) => {
    if (event.target.value === "") {
      this.setState({
        inputError: undefined,
        value: "",
        inputValue: NumberUtil._0,
      });
      return;
    }

    this.setState({
      value: event.target.value,
    });

    const value = Number.parseFloat(event.target.value);
    const regex = /^[+-]?(\d+|\.\d+|\d+\.\d+|\d+\.)$/;
    if (Number.isNaN(value) || !regex.test(event.target.value)) {
      this.setState({
        inputError: "Must be a valid number",
      });
      return;
    }

    const underlyingToken = this.state.underlyingToken;
    if (value <= 0) {
      this.setState({
        inputError: "Must be greater than 0"
      });
    } else if (value.toString().includes("e+")) {
      this.setState({
        inputError: `Number is too large`
      });
    } else if (value.countDecimals() > underlyingToken.decimals) {
      this.setState({
        inputError: `Must only have up to ${underlyingToken.decimals} decimals`
      });
    } else if (this.state.underlyingBalance.lt(fromDecimalToBN(value, underlyingToken.decimals))) {
      this.setState({
        inputError: `Insufficient balance`
      });
    } else {
      this.setState({
        inputError: undefined,
        inputValue: fromDecimalToBN(value, underlyingToken.decimals),
      });
    }
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
        .then(async tx => {
          DmmWeb3Service.watchHash(tx.transactionHash);
          if (process.env.REACT_APP_ENVIRONMENT === 'LOCAL') {
            // The local blockchain mines txns immediately.
            const underlyingAllowance = await this.getAllowance(underlyingToken);
            const dmmAllowance = await this.getAllowance(dmmToken);
            this.setState({
              dmmAllowance,
              underlyingAllowance,
            });
          }
          return true;
        })
        .catch((error) => {
          if (error.code === 4001) {
            // User cancelled the txn
            this.setState({
              snackMessage: 'The transaction was cancelled'
            });
          } else if (error) {
            console.error("Approval error: ", error);
            this.setState({
              unknownError: 'An unknown error occurred while interacting with DMM'
            });
          }
          return false;
        });
    }

    if(!isSetupComplete) {
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
      .then(transaction => {
        DmmWeb3Service.watchHash(transaction.transactionHash);
        return true;
      })
      .catch(error => {
        if (error.code === 4001) {
          this.setState({
            snackMessage: 'The transaction was cancelled'
          });
          return false;
        } else {
          console.error("Mint error: ", error);
          this.setState({
            unknownError: 'An unknown error occurred while interacting with DMM'
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

  switchIsMinting = (isMinting) => {
    this.setState({
      isMinting,
      value: "",
    });
  };

  componentWillUnmount = () => {
    clearInterval(this.subscriptionId);
  };

  pollForData = async () => {
    if (!DmmWeb3Service.walletAddress()) {
      return;
    }

    if (!this.state.dmmTokensMap) {
      const underlyingToken = this.state.underlyingToken;
      const underlyingToDmmTokensMap = await DmmTokenService.getDmmTokens();
      const dmmToken = underlyingToDmmTokensMap[underlyingToken.address];
      const exchangeRate = await DmmTokenService.getExchangeRate(dmmToken.address);
      this.setState({
        dmmToken,
        dmmTokensMap: underlyingToDmmTokensMap,
        exchangeRate,
      });
    }

    const underlyingToken = this.state.underlyingToken;
    const dmmToken = this.state.dmmTokensMap[underlyingToken.address];
    const exchangeRate = await DmmTokenService.getExchangeRate(dmmToken.address);

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

  render = () => {
    if (!DmmWeb3Service.walletAddress()) {
      return (
        <span>Connect your wallet!</span>
      );
    } else {
      const token = this.state.isMinting ? this.state.underlyingToken : this.state.dmmToken;
      const allowanceTooltipTitle = this.state.underlyingAllowance.eq(NumberUtil._0) ? `You must first unlock ${token.symbol}` : '';
      const underlyingToken = this.state.underlyingToken;

      const actionButtonView = this.state.isWaitingForSignature ? (
        <Tooltip title={"Please confirm the signature"}>
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
    }
  };

}

export default Swapper;