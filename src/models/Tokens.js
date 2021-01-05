class Token {
  constructor(address, name, symbol, decimals, imageUrl, isHidden) {
    this.address = address;
    this.name = name;
    this.symbol = symbol;
    this.decimals = decimals;
    this.imageUrl = imageUrl;
    this.addressLower = address.toLowerCase();
    this.isHidden = isHidden;
  }
}

export const DAI = new Token(
  process.env.REACT_APP_DAI_ADDRESS.toLowerCase(),
  'Dai Stablecoin',
  'DAI',
  18,
  'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png',
  false,
);

export const USDC = new Token(
  process.env.REACT_APP_USDC_ADDRESS.toLowerCase(),
  'USD Coin',
  'USDC',
  6,
  'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
  false,
);

export const USDK = new Token(
  process.env.REACT_APP_USDK_ADDRESS.toLowerCase(),
  'USDK',
  'USDK',
  18,
  'https://s2.coinmarketcap.com/static/img/coins/64x64/4064.png',
  false,
);

export const USDT = new Token(
  process.env.REACT_APP_USDT_ADDRESS.toLowerCase(),
  'Tether USD',
  'USDT',
  6,
  'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
  false,
);

export const WETH = new Token(
  process.env.REACT_APP_WETH_ADDRESS.toLowerCase(),
  'Ether',
  'ETH',
  18,
  'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  false,
);

// Put WETH first because we alphabetize it by symbol
export const tokens = [DAI, WETH, USDC, USDK, USDT];

export const tokenAddressToTokenMap = tokens.reduce((map, token) => {
  map[token.address] = token;
  return map;
}, {});
