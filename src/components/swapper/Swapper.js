import * as React from "react";
import {CircularProgress} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import DmmWeb3Service from "../../services/DmmWeb3Service";

import styles from "./Swapper.module.scss";
import Tooltip from "@material-ui/core/Tooltip";
import SwapPanel from '../SwapPanel/SwapPanel';
import BalancesPanel from '../BalancesPanel/BalancesPanel';

import { withTranslations } from '../../services/Translations/Translations';

class Swapper extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const isWalletLoaded = !!DmmWeb3Service.onboard.getState().address;

    const swapPanelAndBalancesPanel = (
      <>
        <SwapPanel
          language={this.props.language}
          isMinting={this.props.isMinting}
          isWaitingForSignature={this.props.isWaitingForSignature}
          isWaitingForApprovalToMine={this.props.isWaitingForApprovalToMine}
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
          activeSupply={this.props.activeSupply}
          totalSupply={this.props.totalSupply}
          tokens={this.props.tokens}
          disabled={!isWalletLoaded}
        />
        <BalancesPanel
          language={this.props.language}
          symbolToUnderlyingBalanceMap={this.props.symbolToUnderlyingBalanceMap}
          symbolToDmmBalanceMap={this.props.symbolToDmmBalanceMap}
          dmmToken={this.props.dmmToken}
          underlyingToken={this.props.underlyingToken}
          dmmTokensMap={this.props.dmmTokensMap}
          symbolToExchangeRateMap={this.props.symbolToExchangeRateMap}
          disabled={!isWalletLoaded}
          isLoading={this.props.isLoadingBalances}
        />
      </>
    );

    if (isWalletLoaded && this.props.dmmToken) {
      return (
        <div className={styles.swapperWrapper}>
          {swapPanelAndBalancesPanel}
        </div>
      );
    } else {
      return (
        <div className={styles.swapperWrapper}>
          <div className={styles.overlay}>
            <div className={styles.connectWalletButton}>
              <div className={styles.title}>To get started</div>
              {this.props.isLoading ? (
                <CircularProgress className={styles.progressBar} color={"inherit"}/>
              ) : (
                <Button
                  className={`${styles.loadWallet} ${isWalletLoaded && styles.loaded}`}
                  disabled={isWalletLoaded}
                  onClick={() => this.props.loadWallet()}
                >
                  {isWalletLoaded ? this.props.excerpt('swapper.walletLoaded', this.props.language) : this.props.excerpt('swapper.connectYourWallet', this.props.language)}
                </Button>
              )}
              <Tooltip
                title={this.props.excerpt('swapper.walletExplanation', this.props.language)}
                arrow
              >
                <div className={styles.whatsAWallet}>
                  <div className={styles.questionIcon}>?</div>
                  <div className={styles.helperText}>What's a wallet?</div>
                </div>
              </Tooltip>
            </div>
          </div>
          {swapPanelAndBalancesPanel}
        </div>
      );
    }
  };
}

export default withTranslations(Swapper);