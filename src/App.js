import React from 'react';

import TopSection from './components/TopSection/TopSection';
import DmmToolbar from './components/toolbar/DmmToolbar.js';
import Swapper from './components/swapper/Swapper';
import Footer from './components/Footer/Footer';

import styles from './App.module.scss';

import DmmWeb3Service from './services/DmmWeb3Service';
import NumberUtil, { BN, MAX_UINT256 } from './utils/NumberUtil';
import ERC20Service from './services/ERC20Service';
import DmmTokenService from './services/DmmTokenService';

import { tokenAddressToTokenMap, tokens, WETH } from './models/Tokens';

import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { asyncForEach } from './utils/ArrayUtil';

import Languages from './services/Translations/Languages';
import USFlag from './assets/US-Flag.png';
import CNFlag from './assets/CN-Flag.png';

library.add(fab);

class App extends React.Component {
  constructor(props) {
    super(props);

    const lang = navigator.language || navigator.userLanguage;

    let browserLanguage = Languages.ENGLISH;

    if (lang) {
      if (lang === 'zh-CN' || lang === 'zh') {
        browserLanguage = Languages.CHINESE;
      }
    }
    else if (props.lang) {
      if (props.lang === 'CN') {
        browserLanguage = Languages.CHINESE;
      }
    }

    this.state = {
      counter: 0,
      tokens: tokens,
      underlyingAllowance: NumberUtil._0,
      exchangeRate: null,
      dmmAllowance: NumberUtil._0,
      underlyingBalance: NumberUtil._0,
      dmmBalance: NumberUtil._0,
      underlyingToken: WETH,
      isMinting: true,
      inputValue: undefined,
      isLoading: false,
      dmmToken: null,
      isWaitingForApprovalToMine: false,
      dmmTokensMap: null,
      activeSupply: NumberUtil._0,
      totalSupply: NumberUtil._0,
      totalTokensPurchased: NumberUtil._0,
      language: browserLanguage,
      selectedLanguage: null,
    };

    this.pollForData().then(() => {
      console.log('Finished initial poll for data');
    });

    this.subscriptionId = setInterval(async () => {
      this.setState({
        isLoadingBalances: true,
      });
      this.pollForData()
        .then(() => {
          this.setState({
            isLoadingBalances: false,
          });
        })
        .catch(() => {
          this.setState({
            isLoadingBalances: false,
          });
        });
    }, 15000);

    DmmWeb3Service.onWalletChange(() => {
      this.setState({
        isLoadingBalances: true,
      });
      this.pollForData()
        .then(() => {
          console.log('Finished poll for data due to wallet change');
          this.setState({
            isLoadingBalances: false,
          });
        })
        .catch(() => {
          this.setState({
            isLoadingBalances: false,
          });
        });
    });
  }

  onSnackbarClose = () => {
    this.setState({
      snackError: undefined,
      unknownError: undefined,
      snackMessage: undefined,
    });
  };

  doOperation = async () => {
    if (!this.state.inputValue || this.state.inputError) {
      return;
    }

    const walletAddressLower = DmmWeb3Service.walletAddress().toLowerCase();
    const underlyingToken = this.state.underlyingToken;
    const dmmToken = this.state.dmmToken;

    const allowance = this.state.isMinting ? this.state.underlyingAllowance : this.state.dmmAllowance;

    this.setState({
      isWaitingForSignature: true,
    });

    let isSetupComplete = true;
    if (allowance.lt(this.state.inputValue)) {
      const tokenToApprove = this.state.isMinting ? underlyingToken : dmmToken;
      isSetupComplete = await ERC20Service.approve(tokenToApprove.address, walletAddressLower, dmmToken.address)
        .on('transactionHash', async transactionHash => {
          this.setState({
            isWaitingForSignature: false,
            isWaitingForApprovalToMine: true,
          });
          DmmWeb3Service.watchHash(transactionHash);
        })
        .then(async () => {
          const underlyingAllowance = await this.getAllowance(underlyingToken);
          this.setState({
            isWaitingForSignature: false,
            isWaitingForApprovalToMine: false,
            underlyingAllowance,
          });
          return true;
        })
        .catch(error => {
          if (error.code === 4001) {
            // User cancelled the txn
            this.setState({
              isWaitingForSignature: false,
              isWaitingForApprovalToMine: false,
              snackMessage: 'The transaction was cancelled',
            });
          } else if (error) {
            console.error('Approval error: ', error);
            this.setState({
              isWaitingForSignature: false,
              isWaitingForApprovalToMine: false,
              unknownError: 'An unknown error occurred while interacting with DMM',
            });
          }
          return false;
        });
    }

    if (!isSetupComplete || walletAddressLower !== DmmWeb3Service.walletAddress().toLowerCase()) {
      // If the allowance setting failed. Don't go any further.
      this.setState({
        isWaitingForSignature: false,
        isWaitingForApprovalToMine: false,
      });
      return;
    }

    this.setState({
      isWaitingForSignature: true,
      isWaitingForApprovalToMine: false,
    });

    let receiptPromise;
    if (this.state.isMinting) {
      if (dmmToken.underlyingTokenAddress.toLowerCase() === WETH.address.toLowerCase()) {
        receiptPromise = DmmTokenService.mintViaEther(dmmToken.address, walletAddressLower, this.state.inputValue);
      } else {
        receiptPromise = DmmTokenService.mint(dmmToken.address, walletAddressLower, this.state.inputValue);
      }
    } else {
      receiptPromise = DmmTokenService.redeem(dmmToken.address, walletAddressLower, this.state.inputValue);
    }

    const isSuccessful = await receiptPromise
      .on('transactionHash', transactionHash => {
        if (this.state.isMinting) {
          DmmWeb3Service.watchHash(transactionHash);
        }
        // This is purposefully NOT awaited. It's a "side-effect" promise
        DmmTokenService.addNewTokensToTotalTokensPurchased(transactionHash);
        this.setState({
          isWaitingForSignature: false,
          isWaitingForActionToMine: true,
        });
        return transactionHash;
      })
      .then(async () => {
        this.setState({
          isWaitingForSignature: false,
          isWaitingForActionToMine: false,
        });
        await this.pollForData();
        return true;
      })
      .catch(error => {
        if (error.code === 4001) {
          this.setState({
            isWaitingForSignature: false,
            isWaitingForActionToMine: false,
            snackMessage: 'The transaction was cancelled',
          });
          return false;
        } else {
          console.error('Mint error: ', error);
          this.setState({
            isWaitingForSignature: false,
            isWaitingForActionToMine: false,
            unknownError: 'An unknown error occurred while interacting with DMM',
          });
          return false;
        }
      });

    this.setState({
      isWaitingForSignature: false,
      isWaitingForActionToMine: false,
      value: isSuccessful ? '' : this.state.value,
    });
  };

  getAllowance = async (token, spender) => {
    return await ERC20Service.getAllowance(
      token.address || token,
      DmmWeb3Service.walletAddress(),
      spender ? spender.address : this.state.dmmToken.address,
    );
  };

  getBalance = async token => {
    return await ERC20Service.getBalance(token.address || token, DmmWeb3Service.walletAddress());
  };

  componentWillUnmount() {
    clearInterval(this.subscriptionId);
    DmmWeb3Service.removeOnWalletChange(this.walletChangeUid);
  }

  pollForData = async () => {
    if (!this.state.dmmTokensMap || this.state.counter % 10 === 0) {
      const underlyingToken = this.state.underlyingToken;
      const underlyingToDmmTokensMap = await DmmTokenService.getDmmTokens();
      const dmmToken = underlyingToDmmTokensMap[underlyingToken.address.toLowerCase()];
      this.setState({
        dmmToken,
        dmmTokensMap: underlyingToDmmTokensMap,
      });
    }
    this.setState({
      counter: this.state.counter + 1,
    });

    const totalTokensPurchasedPromise = DmmTokenService.getTotalTokensPurchased();
    const tokenValuesPromises = Object.values(this.state.dmmTokensMap).map(token => {
      const mActiveSupplyPromise = DmmTokenService.getActiveSupply(token);
      const mExchangeRatePromise = DmmTokenService.getExchangeRate(token.dmmTokenId);
      const mTotalSupplyPromise = DmmTokenService.getTotalSupply(token);
      return Promise.all([mActiveSupplyPromise, mExchangeRatePromise, mTotalSupplyPromise]);
    });
    // maps to [[activeSupply, exchangeRate, totalSupply]]
    const tokenValues = await Promise.all(tokenValuesPromises.map(async promise => await promise));
    const symbolToActiveSupplyMap = {};
    const symbolToExchangeRateMap = {};
    const symbolToTotalSupplyMap = {};

    await asyncForEach(Object.values(this.state.dmmTokensMap), (token, index) => {
      symbolToActiveSupplyMap[token.symbol] = tokenValues[index][0];
      symbolToExchangeRateMap[token.symbol] = tokenValues[index][1];
      symbolToTotalSupplyMap[token.symbol] = tokenValues[index][2];
    });

    const totalTokensPurchased = await totalTokensPurchasedPromise;

    const dmmTokenSymbol = this.state.dmmToken.symbol;
    this.setState({
      symbolToActiveSupplyMap,
      symbolToExchangeRateMap,
      symbolToTotalSupplyMap,
      activeSupply: symbolToActiveSupplyMap[dmmTokenSymbol],
      exchangeRate: symbolToExchangeRateMap[dmmTokenSymbol],
      totalSupply: symbolToTotalSupplyMap[dmmTokenSymbol],
      totalTokensPurchased,
    });

    if (DmmWeb3Service.walletAddress()) {
      this.loadWeb3Data(0).catch(e => {
        console.error('Could not get web3 data due to error: ', e);
        this.setState({
          unknownError: `Could not refresh balances due to an unknown error`,
        });
      });
    }
  };

  loadWeb3Data = async (retryCount, mostRecentError) => {
    if (retryCount === 5) {
      return Promise.reject(mostRecentError || 'An unknown error occurred!');
    }

    const dmmTokens = Object.values(this.state.dmmTokensMap);
    const tokenValuesPromises = dmmTokens.map(dmmToken => {
      const tokenAllowancePromise = this.getAllowance(dmmToken.underlyingTokenAddress, dmmToken);
      const underlyingTokenBalancePromise = this.getBalance(dmmToken.underlyingTokenAddress);
      const dmmTokenBalancePromise = this.getBalance(dmmToken);
      return Promise.all([tokenAllowancePromise, underlyingTokenBalancePromise, dmmTokenBalancePromise]);
    });

    return Promise.all(tokenValuesPromises)
      .then(async tokenValues => {
        const symbolToUnderlyingAllowanceMap = {};
        const symbolToDmmAllowanceMap = {};
        const symbolToUnderlyingBalanceMap = {};
        const symbolToDmmBalanceMap = {};

        await asyncForEach(tokenValues, async (tokenValue, index) => {
          const underlyingToken = tokenAddressToTokenMap[dmmTokens[index].underlyingTokenAddress];
          if (underlyingToken) {
            const symbol = underlyingToken.symbol;
            symbolToUnderlyingAllowanceMap[symbol] = await tokenValue[0];
            symbolToDmmAllowanceMap[symbol] = new BN(MAX_UINT256, 'hex');
            symbolToUnderlyingBalanceMap[symbol] = await tokenValue[1];
            symbolToDmmBalanceMap[symbol] = await tokenValue[2];
          }
        });

        const underlyingTokenSymbol = this.state.underlyingToken.symbol;

        const underlyingBalance = symbolToUnderlyingBalanceMap[underlyingTokenSymbol];
        const dmmBalance = symbolToDmmBalanceMap[underlyingTokenSymbol];

        const underlyingAllowance = symbolToUnderlyingAllowanceMap[underlyingTokenSymbol];
        const dmmAllowance = symbolToDmmAllowanceMap[underlyingTokenSymbol];

        this.setState({
          dmmAllowance,
          dmmBalance,
          underlyingAllowance,
          underlyingBalance,
          symbolToUnderlyingAllowanceMap,
          symbolToUnderlyingBalanceMap,
          symbolToDmmAllowanceMap,
          symbolToDmmBalanceMap,
        });
      })
      .catch(error => {
        return new Promise(resolve => {
          const delayInMillis = 200;
          setTimeout(() => resolve(null), delayInMillis);
        }).then(() => this.loadWeb3Data(retryCount + 1, error));
      });
  };

  loadWallet = () => {
    this.setState({
      isLoading: true,
    });

    DmmWeb3Service.onboard
      .walletSelect()
      .then(result => {
        if (result && typeof DmmWeb3Service.instance.wallet.connect === 'function') {
          return DmmWeb3Service.instance.wallet.connect();
        } else {
          return true;
        }
      })
      .then(() => {
        this.setState({
          isLoading: false,
        });
      })
      .catch(error => {
        const metaMaskDenialErrorMessage = 'This dapp needs access to your account information.';
        if (error.code !== 4001 && error.message !== metaMaskDenialErrorMessage) {
          const errorCode = error.code || Object.keys(error);
          this.setState({
            snackMessage: `There was an unknown error loading your wallet. Error Code: ${errorCode}`,
          });
        }
        this.setState({
          isLoading: false,
        });
        console.error('Found error ', error);
      });
  };

  render() {
    return (
      <div className={styles.appWrapper}>
        <div className={styles.languageSelector}>
          { (this.state.selectedLanguage || this.state.language) === Languages.CHINESE ? (
            <div className={styles.language}>
              <div onClick={() => this.setState({ selectedLanguage: Languages.ENGLISH })}>
                <img src={USFlag} />English
              </div>
            </div>
          ) : (
            <div className={styles.language}>
              <div onClick={() => this.setState({ selectedLanguage: Languages.CHINESE })}>
                <img src={CNFlag} />中文
              </div>
            </div>
          )}
        </div>
        <DmmToolbar language={this.state.selectedLanguage || this.state.language} loadWallet={() => this.loadWallet()} />
        <TopSection
          language={this.state.selectedLanguage || this.state.language}
          symbolToExchangeRateMap={this.state.symbolToExchangeRateMap}
          totalTokensPurchased={this.state.totalTokensPurchased}
          tokens={this.state.tokens}
        />
        <div className={styles.App}>
          <Swapper
            language={this.state.selectedLanguage || this.state.language}
            dmmToken={this.state.dmmToken}
            dmmAllowance={this.state.dmmAllowance}
            dmmBalance={this.state.dmmBalance}
            underlyingToken={this.state.underlyingToken}
            underlyingAllowance={this.state.underlyingAllowance}
            underlyingBalance={this.state.underlyingBalance}
            isLoading={this.state.isLoading}
            isMinting={this.state.isMinting}
            isUnlocked={this.state.isUnlocked}
            isWaitingForSignature={this.state.isWaitingForSignature}
            isWaitingForApprovalToMine={this.state.isWaitingForApprovalToMine}
            loadWallet={() => this.loadWallet()}
            doOperation={() => this.doOperation()}
            updateUnderlying={newTicker => {
              const underlyingToken = this.state.tokens.find(token => token.symbol === newTicker);
              const dmmToken = this.state.dmmTokensMap[underlyingToken.address.toLowerCase()];
              const underlyingTokenSymbol = underlyingToken.symbol;

              const underlyingBalance = this.state.symbolToUnderlyingBalanceMap[underlyingTokenSymbol];
              const dmmBalance = this.state.symbolToDmmBalanceMap[underlyingTokenSymbol];

              // DMM allowance isn't needed for redeeming, so we don't check/change it here.
              const underlyingAllowance = this.state.symbolToUnderlyingAllowanceMap[underlyingTokenSymbol];
              const exchangeRate = this.state.symbolToExchangeRateMap[dmmToken.symbol];
              const activeSupply = this.state.symbolToActiveSupplyMap[dmmToken.symbol];
              const totalSupply = this.state.symbolToTotalSupplyMap[dmmToken.symbol];

              this.setState({
                underlyingToken,
                dmmToken,
                underlyingBalance,
                dmmBalance,
                exchangeRate,
                underlyingAllowance,
                activeSupply,
                totalSupply,
              });
            }}
            updateValue={val => this.setState({ inputValue: val })}
            setIsMinting={val => this.setState({ isMinting: val })}
            exchangeRate={this.state.exchangeRate}
            symbolToUnderlyingBalanceMap={this.state.symbolToUnderlyingBalanceMap}
            symbolToDmmBalanceMap={this.state.symbolToDmmBalanceMap}
            dmmTokensMap={this.state.dmmTokensMap}
            activeSupply={this.state.activeSupply}
            totalSupply={this.state.totalSupply}
            tokens={this.state.tokens}
            isLoadingBalances={this.state.isLoadingBalances}
            symbolToExchangeRateMap={this.state.symbolToExchangeRateMap}
          />
          <Footer
            language={this.state.selectedLanguage || this.state.language}
          />
        </div>
        <Snackbar
          open={!!this.state.snackError || !!this.state.unknownError || this.state.snackMessage}
          autoHideDuration={5000}
          onClose={this.onSnackbarClose}
        >
          <Alert
            severity={this.state.snackError || this.state.unknownError ? 'error' : 'info'}
            onClose={this.onSnackbarClose}
          >
            {this.state.snackError || this.state.unknownError || this.state.snackMessage}
          </Alert>
        </Snackbar>
      </div>
    );
  }
}

export default App;
