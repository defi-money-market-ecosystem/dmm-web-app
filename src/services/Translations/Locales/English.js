/*eslint-disable */
import {
  h1, h2, bold, a
} from './_helper';

/*
 * Rules for translating:
 * - Only change text in quotes ("", '' or `)
 * - When you see something like h1('Welcome') ONLY change what is in the quotes
 *    - h1()        Makes text Header text (very large)
 *    - h2()        Makes text Secondary Header text (very large, not quite as large as h1)
 *    - bold()      Makes text bold
 */

export default {
  'navbar.connectWallet': 'Connect Wallet',
  'navbar.walletConnected': 'Wallet Connected',

  'header.totalmTokens': 'Total Value of mTokens Purchased',
  'header.earning': 'Earning 6.25% APR',

  'swapper.toGetStarted': 'To get started',
  'swapper.connectYourWallet': 'Connect Your Wallet',
  'swapper.walletLoaded': 'Wallet Loaded',
  'swapper.whatsAWallet': 'What\'s a wallet?',
  'swapper.walletExplanation': 'DMM tokens exist on the Ethereum blockchain. To hold, swap, or transfer DMM tokens you require an Ethereum wallet. MetaMask is a good option that works with most browsers.',

  'swapPanel.mint': 'Mint',
  'swapPanel.redeem': 'Redeem',
  'swapPanel.mintSubtitle': 'Mint your tokens into mTokens so it can earn interest.',
  'swapPanel.redeemSubtitle': 'Redeem your mTokens back to tokens with interest.',
  'swapPanel.max': 'MAX',
  'swapPanel.activeSupply': 'Active supply:',
  'swapPanel.totalSupply': 'Total supply:',

  'balances.title': 'Balances',

  'footer.smartContract': 'DMM Controller Smart Contract',
}

/*
 * Add new translations to the bottom of the file. Everytime you reconcile
 * other languages with the English.js file, add a comment saying so at the bottom
 * of the file with the date. This makes keeping track of what needs to be
 * translated much, much easier
 */
