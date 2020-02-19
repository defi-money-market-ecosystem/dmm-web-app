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
    this.onboard = Onboard({
      dappId: '9171b34b-ab20-4982-b3d9-43c073657a88',
      networkId: Number.parseInt(process.env.REACT_APP_NETWORK_ID),
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