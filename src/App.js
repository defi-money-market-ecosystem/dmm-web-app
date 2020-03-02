import React from 'react';

import TopSection from './components/TopSection/TopSection';
import DmmToolbar from './components/toolbar/DmmToolbar.js';
import Swapper from "./components/swapper/Swapper";
import Footer from './components/Footer/Footer';

import styles from './App.module.scss';

import DmmWeb3Service from "./services/DmmWeb3Service";
import NumberUtil, {BN} from "./utils/NumberUtil";
import ERC20Service from "./services/ERC20Service";
import DmmTokenService from "./services/DmmTokenService";

import {USDC, DAI} from "./models/Tokens";

import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";

import {library} from '@fortawesome/fontawesome-svg-core';
import {fab} from '@fortawesome/free-brands-svg-icons';

library.add(fab);

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      underlyingAllowance: NumberUtil._0,
      exchangeRate: null,
      mDaiExchangeRate: null,
      mUsdcExchangeRate: null,
      dmmAllowance: NumberUtil._0,
      underlyingBalance: NumberUtil._0,
      dmmBalance: NumberUtil._0,
      underlyingToken: USDC,
      isMinting: true,
      inputValue: undefined,
      isLoading: false,
      dmmToken: null,
      isWaitingForApprovalToMine: false,
      dmmTokensMap: null,
      daiBalance: NumberUtil._0,
      usdcBalance: NumberUtil._0,
      mDaiBalance: NumberUtil._0,
      mUsdcBalance: NumberUtil._0,
      mDaiToken: null,
      mUsdcToken: null,
      activeSupply: NumberUtil._0,
      totalSupply: NumberUtil._0,
      totalActive: NumberUtil._0,
      tokens: [DAI, USDC],
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
    console.log("Input value ", this.state.inputValue ? this.state.inputValue.toString() : undefined);
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
    if (allowance.lt(this.state.inputValue)) {
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
        this.pollForData().then(() => {
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

  componentWillUnmount() {
    clearInterval(this.subscriptionId);
    DmmWeb3Service.removeOnWalletChange(this.walletChangeUid);
  };

  pollForData = async () => {
    if (!DmmWeb3Service.walletAddress()) {
      // GUARD STATEMENT; note returns at the end of this if-statement.
      const underlyingToDmmTokensMap = await DmmTokenService.getDmmTokens();
      const dmmToken = underlyingToDmmTokensMap[this.state.underlyingToken.address.toLowerCase()];
      const exchangeRate = await DmmTokenService.getExchangeRate(dmmToken.dmmTokenId);
      const mDaiExchangeRate = await DmmTokenService.getExchangeRate(underlyingToDmmTokensMap[DAI.address.toLowerCase()].dmmTokenId);
      const mUsdcExchangeRate = await DmmTokenService.getExchangeRate(underlyingToDmmTokensMap[USDC.address.toLowerCase()].dmmTokenId);
      const activeSupply = await DmmTokenService.getActiveSupply(dmmToken);
      const totalSupply = await DmmTokenService.getTotalSupply(dmmToken);
      const mDaiActive = await DmmTokenService.getActiveSupply(underlyingToDmmTokensMap[DAI.address.toLowerCase()]);
      const mUsdcActive = await DmmTokenService.getActiveSupply(underlyingToDmmTokensMap[USDC.address.toLowerCase()]);
      this.setState({
        exchangeRate,
        mDaiExchangeRate,
        mUsdcExchangeRate,
        activeSupply,
        totalSupply,
        totalActive: mDaiActive.add(mUsdcActive)
      });
      return;
    }

    if (!this.state.dmmTokensMap) {
      const underlyingToken = this.state.underlyingToken;
      const underlyingToDmmTokensMap = await DmmTokenService.getDmmTokens();
      const dmmToken = underlyingToDmmTokensMap[underlyingToken.address.toLowerCase()];
      this.setState({
        dmmToken,
        dmmTokensMap: underlyingToDmmTokensMap,
      });
    }

    const underlyingToken = this.state.underlyingToken;
    const dmmToken = this.state.dmmTokensMap[underlyingToken.address.toLowerCase()];
    const activeSupply = await DmmTokenService.getActiveSupply(dmmToken);
    const totalSupply = await DmmTokenService.getTotalSupply(dmmToken);

    const mDaiToken = this.state.dmmTokensMap[DAI.address.toLowerCase()];
    const mDaiActive = await DmmTokenService.getActiveSupply(mDaiToken);

    const mUsdcToken = this.state.dmmTokensMap[USDC.address.toLowerCase()];
    const mUsdcActive = await DmmTokenService.getActiveSupply(this.state.dmmTokensMap[USDC.address.toLowerCase()]);

    const mDaiExchangeRate = await DmmTokenService.getExchangeRate(mDaiToken.dmmTokenId);
    const mUsdcExchangeRate = await DmmTokenService.getExchangeRate(mUsdcToken.dmmTokenId);

    const daiBalance = await this.getBalance(DAI);
    const usdcBalance = await this.getBalance(USDC);

    const daiAllowance = await this.getAllowance(DAI);
    const usdcAllowance = await this.getAllowance(USDC);

    const mDaiBalance = await this.getBalance(this.state.dmmTokensMap[DAI.address.toLowerCase()]);
    const mUsdcBalance = await this.getBalance(this.state.dmmTokensMap[USDC.address.toLowerCase()]);

    const underlyingBalance = underlyingToken.symbol === DAI.symbol ? daiBalance : usdcBalance;
    const dmmBalance = underlyingToken.symbol === DAI.symbol ? mDaiBalance : mUsdcBalance;

    const underlyingAllowance = underlyingToken.symbol === DAI.symbol ? daiAllowance : usdcAllowance;
    const dmmAllowance = new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex');

    this.setState({
      dmmAllowance,
      dmmBalance,
      underlyingAllowance,
      underlyingBalance,
      mDaiExchangeRate,
      mUsdcExchangeRate,
      daiAllowance,
      usdcAllowance,
      daiBalance,
      usdcBalance,
      mDaiBalance,
      mUsdcBalance,
      mDaiToken,
      mUsdcToken,
      activeSupply,
      totalSupply,
      totalActive: mDaiActive.add(mUsdcActive)
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
    return (
      <>
        <DmmToolbar/>
        <TopSection
          daiRate={this.state.mDaiExchangeRate}
          usdcRate={this.state.mUsdcExchangeRate}
          totalActive={this.state.totalActive}
        />
        <div className={styles.App}>
          <Swapper
            dmmToken={this.state.dmmToken}
            dmmAllowance={this.state.dmmAllowance}
            dmmBalance={this.state.dmmBalance}
            underlyingToken={this.state.underlyingToken}
            underlyingAllowance={this.state.underlyingAllowance}
            underlyingBalance={this.state.underlyingBalance}
            mDaiExchangeRate={this.state.mDaiExchangeRate}
            mUsdcExchangeRate={this.state.mUsdcExchangeRate}
            isLoading={this.state.isLoading}
            isMinting={this.state.isMinting}
            isUnlocked={this.state.isUnlocked}
            isWaitingForSignature={this.state.isWaitingForSignature}
            isWaitingForApprovalToMine={this.state.isWaitingForApprovalToMine}
            loadWallet={() => this.loadWallet()}
            doOperation={() => this.doOperation()}
            updateUnderlying={(newTicker) => {
              const underlyingToken = this.state.tokens.find(token => token.symbol === newTicker);
              const dmmToken = this.state.dmmTokensMap[underlyingToken.address.toLowerCase()];
              const isDAI = underlyingToken.symbol === DAI.symbol;

              const underlyingBalance = isDAI ? this.state.daiBalance : this.state.usdcBalance;
              const dmmBalance = isDAI ? this.state.mDaiBalance : this.state.mUsdcBalance;

              // DMM allowance isn't needed for redeeming, so we don't check/change it here.
              const underlyingAllowance = isDAI ? this.state.daiAllowance : this.state.usdcAllowance;

              const exchangeRate = isDAI ? this.state.mDaiExchangeRate : this.state.mUsdcExchangeRate;

              this.setState({underlyingToken, dmmToken, underlyingBalance, dmmBalance, exchangeRate, underlyingAllowance});
            }}
            updateValue={(val) => this.setState({inputValue: val})}
            setIsMinting={(val) => this.setState({isMinting: val})}
            exchangeRate={this.state.exchangeRate}
            daiBalance={this.state.daiBalance}
            usdcBalance={this.state.usdcBalance}
            mDaiBalance={this.state.mDaiBalance}
            mUsdcBalance={this.state.mUsdcBalance}
            mDaiToken={this.state.mDaiToken}
            mUsdcToken={this.state.mUsdcToken}
            activeSupply={this.state.activeSupply}
            totalSupply={this.state.totalSupply}
            tokens={this.state.tokens}
          />
        </div>
        <Snackbar open={!!this.state.snackError || !!this.state.unknownError || this.state.snackMessage}
                  autoHideDuration={5000}
                  onClose={this.onSnackbarClose}>
          <Alert severity={this.state.snackError || this.state.unknownError ? "error" : "info"}
                 onClose={this.onSnackbarClose}>
            {this.state.snackError || this.state.unknownError || this.state.snackMessage}
          </Alert>
        </Snackbar>
        <Footer/>
      </>
    );
  }

}

export default App;
