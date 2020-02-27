import React from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import {CircularProgress, Paper, TextField} from "@material-ui/core";
import InputAdornment from "@material-ui/core/InputAdornment";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import {humanize} from "../../utils/NumberUtil";
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import ArrowForward from '@material-ui/icons/ArrowForward';
import ArrowDropDown from '@material-ui/icons/ArrowDropDown';
import styles from './SwapPanel.module.scss';
import NumberUtil, {fromDecimalToBN} from "../../utils/NumberUtil";

const theme = createMuiTheme({
  palette: {
    secondary: {
      main: '#327ccb'
    },
  },
});

const UNDERLYING = 0;
const DMM = 1;

class SwapPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentFunction: 0,
      underlyingValue: '0',
      underlyingAmount: NumberUtil._0,
      dmmValue: '0',
      dmmAmount: NumberUtil._0,
      inputError: null,
      lastSelected: UNDERLYING,
      lastUnderlyingLen: 1,
      lastDmmLen: 1,
      underlyingSelectorExpanded: false,
    }
  }

  // TODO - decide if this is the way to go, and if there's a way to fix the cursor issue
  static numberWithCommas(x) {
    const parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  updateUnderlying(e) {
    let cursor = e.target.selectionStart;
    const newAmt = e.target.value.replace(/,/g, '');
    const newFormattedAmt = SwapPanel.numberWithCommas(newAmt);
    const regex = /^[+-]?(\d+|\.\d+|\d+\.\d+|\d+\.)$/;
    let isInvalid = false;
    if (Number.isNaN(newAmt) || !regex.test(newAmt)) {
      isInvalid = true;
    }
    if (newFormattedAmt.length > this.state.lastUnderlyingLen) {
      cursor = cursor + (newFormattedAmt.length - this.state.lastUnderlyingLen);
    }
    else {
      cursor = cursor - (this.state.lastUnderlyingLen - newFormattedAmt.length) + 1;
    }
    const target = e.target;
    this.setState({
      underlyingValue: newFormattedAmt,
      underlyingAmount: isInvalid ? NumberUtil._0 : fromDecimalToBN(Number.parseFloat(newAmt === '' ? '0' : newAmt), this.props.underlyingToken.decimals),
      dmmValue: isInvalid ? '0' : SwapPanel.numberWithCommas(humanize(fromDecimalToBN(Number.parseFloat(newAmt === '' ? '0' : newAmt), this.props.underlyingToken.decimals).mul(NumberUtil._1).div(this.props.exchangeRate), this.props.underlyingToken.decimals)),
      dmmAmount: isInvalid ? NumberUtil._0 : fromDecimalToBN(Number.parseFloat(newAmt === '' ? '0' : newAmt), this.props.underlyingToken.decimals).mul(NumberUtil._1).div(this.props.exchangeRate),
      lastSelected: UNDERLYING,
      lastUnderlyingLen: newFormattedAmt.length,
      lastDmmLen: SwapPanel.numberWithCommas(humanize(fromDecimalToBN(Number.parseFloat(newAmt === '' ? '0' : newAmt), this.props.underlyingToken.decimals).mul(NumberUtil._1).div(this.props.exchangeRate), this.props.underlyingToken.decimals)).length
    }, () => {
      target.selectionStart = cursor;
      target.selectionEnd = cursor;
    });
    
    this.onInputAmountChange(newAmt);
  }

  updateDmm(e) {
    let cursor = e.target.selectionStart;
    const newAmt = e.target.value.replace(/,/g, '');
    const newFormattedAmt = SwapPanel.numberWithCommas(newAmt);
    const regex = /^[+-]?(\d+|\.\d+|\d+\.\d+|\d+\.)$/;
    let isInvalid = false;
    if (Number.isNaN(newAmt) || !regex.test(newAmt)) {
      isInvalid = true;
    }
    if (newFormattedAmt.length > this.state.lastDmmLen) {
      cursor = cursor + (newFormattedAmt.length - this.state.lastDmmLen);
    }
    else {
      cursor = cursor - (this.state.lastDmmLen - newFormattedAmt.length) + 1;
    }
    const target = e.target;

    this.setState({
      dmmValue: SwapPanel.numberWithCommas(newAmt),
      dmmAmount: isInvalid ? NumberUtil._0 : fromDecimalToBN(Number.parseFloat(newAmt === '' ? '0' : newAmt), this.props.underlyingToken.decimals),
      underlyingValue: isInvalid ? '0' : SwapPanel.numberWithCommas(humanize(fromDecimalToBN(Number.parseFloat(newAmt === '' ? '0' : newAmt), this.props.underlyingToken.decimals).mul(this.props.exchangeRate).div(NumberUtil._1), this.props.underlyingToken.decimals)),
      underlyingAmount: isInvalid ? NumberUtil._0 : fromDecimalToBN(Number.parseFloat(newAmt === '' ? '0' : newAmt), this.props.underlyingToken.decimals).mul(this.props.exchangeRate).div(NumberUtil._1),
      lastSelected: DMM,
      lastDmmLen: newFormattedAmt.length,
      LastUnderlyingLen: SwapPanel.numberWithCommas(humanize(fromDecimalToBN(Number.parseFloat(newAmt === '' ? '0' : newAmt), this.props.underlyingToken.decimals).mul(NumberUtil._1).div(this.props.exchangeRate), this.props.underlyingToken.decimals)).length
    }, () => {
      target.selectionStart = cursor;
      target.selectionEnd = cursor;
    });

    this.onInputAmountChange(newAmt);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.exchangeRate !== this.props.exchangeRate) {
      if (this.state.lastSelected === UNDERLYING) {
        this.setState({
          dmmValue: !this.state.inputError && SwapPanel.numberWithCommas(humanize(this.state.underlyingAmount.mul(NumberUtil._1).div(this.props.exchangeRate), this.props.underlyingToken.decimals)),
          dmmAmount: !this.state.inputError && this.state.underlyingAmount.mul(NumberUtil._1).div(this.props.exchangeRate),
          lastDmmLen: !this.state.inputError && SwapPanel.numberWithCommas(humanize(this.state.underlyingAmount.mul(NumberUtil._1).div(this.props.exchangeRate), this.props.underlyingToken.decimals)),
        });
      }
      else {
        this.setState({
          underlyingValue: !this.state.inputError && SwapPanel.numberWithCommas(humanize(this.state.dmmAmount.mul(this.props.exchangeRate).div(NumberUtil._1), this.props.underlyingToken.decimals)),
          underlyingAmount: !this.state.inputError && this.state.dmmAmount.mul(this.props.exchangeRate).div(NumberUtil._1),
          lastUnderlyingLen: !this.state.inputError && SwapPanel.numberWithCommas(humanize(this.state.dmmAmount.mul(this.props.exchangeRate).div(NumberUtil._1), this.props.underlyingToken.decimals)),
        });
      }
    }
  }

  onInputAmountChange = (newVal) => {
    if (newVal === "") {
      this.setState({
        inputError: undefined,
        value: "",
        inputValue: NumberUtil._0,
      });
      return;
    }

    const value = Number.parseFloat(newVal);
    const regex = /^[+-]?(\d+|\.\d+|\d+\.\d+|\d+\.)$/;
    if (Number.isNaN(value) || !regex.test(newVal)) {
      this.setState({
        inputError: "Must be a valid number",
      });
      return;
    }

    const underlyingToken = this.props.underlyingToken;
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
    } else if (this.props.underlyingBalance.lt(fromDecimalToBN(value, underlyingToken.decimals))) {
      this.setState({
        inputError: `Insufficient balance`
      });
    } else {
      this.setState({
        inputError: undefined,
      });
    }
  };

  maxUnderlying() {
    const newAmt = ''+humanize(this.props.underlyingBalance, this.props.underlyingToken.decimals);
    const newFormattedAmt = SwapPanel.numberWithCommas(newAmt);
    this.setState({
      underlyingValue: newFormattedAmt,
      underlyingAmount: this.props.underlyingBalance,
      dmmValue: SwapPanel.numberWithCommas(humanize(this.props.underlyingBalance.mul(NumberUtil._1).div(this.props.exchangeRate), this.props.underlyingToken.decimals)),
      dmmAmount: this.props.underlyingBalance.mul(NumberUtil._1).div(this.props.exchangeRate),
      lastSelected: UNDERLYING,
      lastUnderlyingLen: newFormattedAmt.length,
      lastDmmLen: SwapPanel.numberWithCommas(humanize(this.props.underlyingBalance.mul(NumberUtil._1).div(this.props.exchangeRate), this.props.underlyingToken.decimals)).length
    });
  }

  setUnderlying(ticker) {
    this.props.updateUnderlying(ticker);
    this.setState({ underlyingSelectorExpanded: false });
  }

  render() {
    return (
      <div className={`${styles.SwapPanel} ${this.props.disabled && styles.disabled}`}>
        <ThemeProvider theme={theme}>
          <div className={styles.mintOrRedeem}>
            <Tabs value={this.state.currentFunction} onChange={(e, newVal) => this.setState({ currentFunction: newVal })} aria-label="simple tabs example" centered>
              <Tab label="Mint" />
              <Tab label="Redeem" />
            </Tabs>
          </div>
          <div className={styles.helperText}>
            Mint your DAI and USDC into mDAI and mUSDC so it can earn interest.
          </div>
          {/*<div className={styles.balanceSection}>
            You have: { this.props.underlyingBalance } <span className={styles.light}>{ this.props.selectedUnderlying }</span>
          </div>*/}
          <div className={styles.inputForm}>
            <div className={styles.input}>
              <div className={styles.underlyingSection}>
                <div className={styles.maxBalance} onClick={() => this.maxUnderlying()}>
                  MAX
                </div>
                <div className={styles.inputWrapper}>
                  <input
                    onChange={(e) => this.updateUnderlying(e)}
                    value={this.state.underlyingValue}
                    />
                  <div className={`${styles.underlyingSelector} ${this.state.underlyingSelectorExpanded && styles.expanded}`} onClick={() => this.setState({ underlyingSelectorExpanded: true })}>
                    <div className={styles.asset}>{ this.props.underlyingToken ? this.props.underlyingToken.symbol : 'DAI' }</div>
                    <ArrowDropDown/>
                    <div
                      className={`${styles.underlyingOption} ${styles.first}`}
                      onClick={(e) => {this.state.underlyingSelectorExpanded && this.setUnderlying(this.props.underlyingToken ? this.props.underlyingToken.symbol : 'DAI'); this.state.underlyingSelectorExpanded && e.stopPropagation();}}>
                      { this.props.underlyingToken ? this.props.underlyingToken.symbol : 'DAI' }
                    </div>
                    <div
                      className={styles.underlyingOption}
                      onClick={(e) => {this.state.underlyingSelectorExpanded && this.setUnderlying(this.props.underlyingToken ? this.props.underlyingToken.symbol === 'DAI' ? 'USDC' : 'DAI' : 'USDC'); this.state.underlyingSelectorExpanded && e.stopPropagation();}}>
                      { this.props.underlyingToken ? this.props.underlyingToken.symbol === 'DAI' ? 'USDC' : 'DAI' : 'USDC' }
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.arrow}>
                <ArrowForward/>
              </div>
              <div className={styles.dmmSection}>
                <div className={styles.maxBalance}>
                  MAX
                </div>
                <div className={styles.inputWrapper}>
                  <input
                    onChange={(e) => this.updateDmm(e)}
                    value={this.state.dmmValue}
                  />
                  <div className={styles.asset}>
                    DMM
                  </div>
                </div>
              </div>
            </div>
            {/*<div className={styles.youReceive}>
              You receive { amount } m{ this.props.selectedUnderlying }
            </div>*/}
          </div>
          <div className={styles.submit}>
            { this.props.isWaitingForSignature ? (
              this.props.isUnlocked ? (
                <Tooltip title={'Awaiting signature from wallet'}>
                  <CircularProgress color={'primary'}/> Unlocking
                </Tooltip>
              ) : (
                <Tooltip title={'Awaiting signature from wallet'}>
                  <CircularProgress color={'primary'}/> {this.props.isMinting ? "Minting" : "Redeeming"}
                </Tooltip>
              )
            ) : (
              <Button className={styles.submitButton} onClick={() => this.props.onDoOperation()} disabled={this.state.inputError}>
                {this.props.isMinting ? "Mint" : "Redeem"}
              </Button>
            )}
          </div>
        </ThemeProvider>
      </div>
    );
  }
}

export default SwapPanel;
