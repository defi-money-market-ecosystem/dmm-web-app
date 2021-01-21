import Web3 from 'web3';
import WalletLink from 'walletlink';

class BlockNativeWalletInterfaces {
  constructor(props) {
    this.infuraApiKey = props.infuraApiKey;
    this.web3ProviderUrl = `https://mainnet.infura.io/v3/${this.infuraApiKey}`;
    this.walletLink = new WalletLink({
      appName: 'DeFi Money Market (DMM)',
      appLogoUrl: 'https://defimoneymarket.com/dmm-logo-square.png',
      darkMode: false,
    });
    this.walletLinkExtension = {
      name: 'WalletLink',
      svg: `
      <svg xmlns="http://www.w3.org/2000/svg"
       width="512.000000pt" height="512.000000pt" viewBox="0 0 512.000000 512.000000"
       preserveAspectRatio="xMidYMid meet">
          <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
          fill="#2b63f5" stroke="none">
            <path d="M0 2560 l0 -2560 2560 0 2560 0 0 2560 0 2560 -2560 0 -2560 0 0
            -2560z m2780 1790 c578 -71 1107 -437 1374 -951 103 -197 161 -377 192 -599
            22 -158 15 -433 -16 -580 -163 -789 -781 -1357 -1575 -1451 -139 -16 -392 -6
            -530 21 -856 169 -1465 903 -1465 1767 0 164 12 269 47 418 80 342 252 639
            516 891 273 261 608 424 980 478 113 17 363 20 477 6z"/>
            <path d="M2050 3122 c-71 -35 -70 -30 -70 -567 0 -364 3 -486 13 -505 7 -13
            28 -35 46 -47 l34 -23 486 0 c369 0 492 3 511 13 13 7 35 28 47 46 l23 34 0
            481 c0 438 -2 484 -18 516 -35 71 -30 70 -562 70 -432 0 -478 -2 -510 -18z"/>
          </g>
      </svg>`,
      wallet: async () => {
        const provider = this.walletLink.makeWeb3Provider(this.web3ProviderUrl, process.env.REACT_APP_NETWORK_ID);
        const web3 = new Web3(provider);
        let isLoadingObj = {
          promise: Promise.resolve(false),
        };
        const walletInterface = {
          name: 'WalletLink',
          connect: async () => {
            isLoadingObj = {
              promise: new Promise((resolve, reject) => {
                isLoadingObj.resolve = resolve;
                isLoadingObj.reject = reject;
              }),
            };
            const accounts = await provider
              .enable()
              .then(accounts => {
                if (isLoadingObj.resolve) {
                  isLoadingObj.resolve(true);
                }
                return accounts;
              })
              .catch(error => {
                if (isLoadingObj.reject) {
                  isLoadingObj.reject(error);
                }
                return Promise.reject(error);
              });
            web3.eth.defaultAccount = accounts[0];
            return accounts;
          },
          loading: async () => {
            if (isLoadingObj && isLoadingObj.promise) {
              await isLoadingObj.promise;
            } else {
              return Promise.resolve(true);
            }
          },
          disconnect: async () => {
            await this.walletLink.disconnect();
            web3.eth.defaultAccount = null;
            return [];
          },
          address: {
            get: async () => web3.eth.defaultAccount,
          },
          network: {
            get: async () => web3.eth.net.getId(),
          },
          balance: {
            get: async () => web3.eth.getBalance(web3.eth.defaultAccount),
          },
        };
        return {
          provider,
          interface: walletInterface,
        };
      },
      desktop: true,
      preferred: true,
    };
    this.alphaWalletExtension = {
      name: 'Alpha Wallet',
      iconSrc:
        'https://raw.githubusercontent.com/AlphaWallet/alpha-wallet-android/master/app/src/main/res/mipmap-xxxhdpi/ic_alpha.png',
      wallet: async () => {
        const web3 = window.web3;
        const walletInterface = web3.currentProvider.isAlphaWallet
          ? {
              name: 'Alpha Wallet',
              connect: async () => true,
              loading: async () => false,
              address: {
                get: async () => web3.eth.defaultAccount,
              },
              network: {
                get: async () => web3.eth.net.getId(),
              },
              balance: {
                get: async () => web3.eth.getBalance(web3.eth.defaultAccount),
              },
            }
          : null;
        return {
          provider: web3 ? web3.currentProvider : null,
          interface: walletInterface,
        };
      },
      desktop: false,
      mobile: true,
      preferred: true,
    };

    this.allWalletInterfaces = [this.walletLinkExtension, this.alphaWalletExtension];
  }
}

export default BlockNativeWalletInterfaces;
