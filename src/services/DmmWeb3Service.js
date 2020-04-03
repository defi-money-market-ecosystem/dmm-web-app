import WalletLink from 'walletlink';
import Onboard from "bnc-onboard";
import Notify from "bnc-notify";
import Web3 from "web3";

const getRandomString = () => {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 40);
};

class DmmWeb3Service {

  static instance = new DmmWeb3Service();

  static onboard = DmmWeb3Service.instance.onboard;

  static notify = DmmWeb3Service.instance.notify;

  static walletAddress = () => DmmWeb3Service.onboard.getState().address;

  static walletChangeFns = {};

  static watchHash(hash) {
    if (process.env.REACT_APP_ENVIRONMENT !== 'LOCAL') {
      DmmWeb3Service.notify.hash(hash);
    }
  }

  static onWalletChange(callback) {
    const uid = getRandomString();
    DmmWeb3Service.walletChangeFns[uid] = callback;
  }

  static removeOnWalletChange(uid) {
    DmmWeb3Service.walletChangeFns[uid] = null;
  }

  constructor() {
    this.web3 = null;
    this.wallet = null;

    const infuraApiKey = '6016c4ab356b402ab455b2a8890efe7f';
    const web3ProviderUrl = `https://mainnet.infura.io/v3/${infuraApiKey}`;

    const walletLink = new WalletLink({
      appName: 'DeFi Money Market (DMM)',
      appLogoUrl: 'https://defimoneymarket.com/dmm-logo-square.png',
      darkMode: false,
    });

    const walletLinkSvg = `
      <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
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
      </svg>`;

    const walletLinkExtension = {
      name: 'Wallet Link',
      svg: walletLinkSvg,
      wallet: async () => {
        const provider = walletLink.makeWeb3Provider(web3ProviderUrl, process.env.REACT_APP_NETWORK_ID);
        const web3 = new Web3(provider);
        const walletInterface = {
          name: 'Wallet Link',
          connect: async () => {
            const accounts = await provider.enable();
            web3.eth.defaultAccount = accounts[0];
            return accounts;
          },
          loading: async () => provider.enable(),
          disconnect: async () => {
            await walletLink.disconnect();
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
        }
      },
      desktop: true,
      preferred: true,
    };

    this.onboard = Onboard({
      dappId: '9171b34b-ab20-4982-b3d9-43c073657a88',
      networkId: Number.parseInt(process.env.REACT_APP_NETWORK_ID),
      walletSelect: {
        wallets: [
          {
            walletName: "coinbase",
            preferred: true,
            label: 'Coinbase Wallet'
          },
          {
            walletName: "trust",
            preferred: true,
          },
          {
            walletName: "metamask",
            preferred: true,
          },
          {
            walletName: "fortmatic",
            apiKey: "pk_live_45D9847605667E0F",
            preferred: true,
            label: 'Login with Email or Phone',
          },
          // {
          //   walletName: "portis",
          //   apiKey: PORTIS_KEY,
          //   preferred: true,
          //   label: 'Login with Email',
          // },
          // {
          //   walletName: "squarelink",
          //   apiKey: SQUARELINK_KEY
          // },
          {
            walletName: "authereum"
          },
          {
            walletName: "walletConnect",
            infuraKey: infuraApiKey,
            preferred: true,
          },
          {
            walletName: "opera"
          },
          {
            walletName: "operaTouch"
          },
          {
            walletName: "torus",

            preferred: true,
          },
          {
            walletName: "status"
          },
          {
            walletName: "dapper",
          },
          walletLinkExtension
        ],
      },
      subscriptions: {
        address: (address) => {
          Object.values(DmmWeb3Service.walletChangeFns).forEach((callbackFn) => {
            callbackFn(address);
          });
        },
        wallet: (wallet) => {
          this.web3 = new Web3(wallet.provider);
          this.wallet = wallet;
        }
      }
    });
    this.notify = Notify({
      dappId: '9171b34b-ab20-4982-b3d9-43c073657a88',
      networkId: Number.parseInt(process.env.REACT_APP_NETWORK_ID),
    });
  }

}

export default DmmWeb3Service;