import React from 'react';

import TopSection from './components/TopSection/TopSection';
import DmmToolbar from './components/toolbar/DmmToolbar.js';

import styles from './App.module.scss';
import Swapper from "./components/swapper/Swapper";
import DmmWeb3Service from "./services/DmmWeb3Service";
import NumberUtil from "./utils/NumberUtil";
import ERC20Service from "./services/ERC20Service";
import DmmTokenService from "./services/DmmTokenService";

import {USDC, DAI} from "./models/Tokens";
import {humanize} from "./utils/NumberUtil";

import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import {fromDecimalToBN} from "./utils/NumberUtil";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      underlyingAllowance: NumberUtil._0,
      exchangeRate: null,
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
      mdaiBalance: NumberUtil._0,
      musdcBalance: NumberUtil._0,
      mdaiToken: null,
      musdcToken: null
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
        this.pollForData().then(() => {});
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

    const daiBalance = await this.getBalance(DAI);
    const usdcBalance = await this.getBalance(USDC);
    const mdaiBalance = await this.getBalance(this.state.dmmTokensMap[DAI.address.toLowerCase()]);
    const musdcBalance = await this.getBalance(this.state.dmmTokensMap[USDC.address.toLowerCase()]);

    const mdaiToken = this.state.dmmTokensMap[DAI.address.toLowerCase()];
    const musdcToken = this.state.dmmTokensMap[USDC.address.toLowerCase()]

    const underlyingAllowance = await this.getAllowance(underlyingToken);
    const dmmAllowance = await this.getAllowance(dmmToken);

    this.setState({
      dmmAllowance,
      dmmBalance,
      underlyingAllowance,
      underlyingBalance,
      exchangeRate,
      daiBalance,
      usdcBalance,
      mdaiBalance,
      musdcBalance,
      mdaiToken,
      musdcToken
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
        <TopSection/>
        <div className={styles.App}>
          <Swapper
            dmmToken={this.state.dmmToken}
            dmmAllowance={this.state.dmmAllowance}
            dmmBalance={this.state.dmmBalance}
            underlyingToken={this.state.underlyingToken}
            underlyingAllowance={this.state.underlyingAllowance}
            underlyingBalance={this.state.underlyingBalance}
            exchangeRate={this.state.exchangeRate}
            isLoading={this.state.isLoading}
            isMinting={this.state.isMinting}
            isUnlocked={this.state.isUnlocked}
            isWaitingForSignature={this.state.isWaitingForSignature}
            isWaitingForApprovalToMine={this.state.isWaitingForApprovalToMine}
            loadWallet={() => this.loadWallet()}
            doOperation={() => this.doOperation()}
            updateUnderlying={(newToken) => this.setState({ underlyingToken: (newToken === 'USDC' ? USDC : DAI)})}
            updateValue={(val) => this.setState({ inputValue: val })}
            setIsMinting={(val) => this.setState({ isMinting: val })}
            daiBalance={this.state.daiBalance}
            usdcBalance={this.state.usdcBalance}
            mdaiBalance={this.state.mdaiBalance}
            musdcBalance={this.state.musdcBalance}
            mdaiToken={this.state.mdaiToken}
            musdcToken={this.state.musdcToken}
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
      </>
    );
  }

}

export default App;
