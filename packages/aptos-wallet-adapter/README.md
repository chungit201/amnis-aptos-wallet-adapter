# aptos-wallet-adapter

React `WalletProvider` supporting loads of aptos wallets.

Supports:

- [Aptos official wallet](https://github.com/aptos-labs/aptos-core/releases/tag/wallet-v0.1.1)
- [Martian wallet](https://martianwallet.xyz/)
- [Fewcha wallet](https://fewcha.app/)
- [Hippo wallet](https://github.com/hippospace/hippo-wallet)
- [Pontem Wallet](https://pontem.network/pontem-wallet)
- [Spika wallet](https://spika.app)
- [Rise Wallet](https://risewallet.io/)
- [Fletch wallet](http://fletchwallet.io/)
- [TokenPocket Wallet](https://tokenpocket.pro)
- [ONTO Wallet](https://onto.app)
- [Blocto wallet](https://portto.com/download)
- [Nightly Wallet](https://nightly.app/download)
- [FoxWallet](https://foxwallet.com)
- [Spacecy wallet](https://spacecywallet.com/)
# Installation

with `yarn`

```
yarn add @amnis_finance/aptos-wallet-adapter
```

with `npm`

```
npm install @amnis_finance/aptos-wallet-adapter
```

# Examples

## **Frontend Integration**

Here's an example of how we integrate the adapter into [amnis frontend](https://github.com/hippospace/hippo-frontend/blob/main/src/Providers.tsx):

### **Wallet integration**

Wallets source code [here](https://stake.amnis.finance).

# Use React Provider

```typescript
import React from 'react';
import {
  WalletProvider,
  HippoWalletAdapter,
  AptosWalletAdapter,
  HippoExtensionWalletAdapter,
  MartianWalletAdapter,
  FewchaWalletAdapter,
  PontemWalletAdapter,
  SpikaWalletAdapter,
  RiseWalletAdapter,
  FletchWalletAdapter,
  TokenPocketWalletAdapter,
  ONTOWalletAdapter,
  BloctoWalletAdapter,
  SafePalWalletAdapter,
  FoxWalletAdapter,
  CloverWalletAdapter,
  SpacecyWalletAdapter
} from '@amnis_finance/aptos-wallet-adapter';

const wallets = [
  new MartianWalletAdapter(),
  new AptosWalletAdapter(),
  new FewchaWalletAdapter(),
  new HippoExtensionWalletAdapter(),
  new PontemWalletAdapter(),
  new SpikaWalletAdapter(),
  new RiseWalletAdapter(),
  new FletchWalletAdapter(),
  new TokenPocketWalletAdapter(),
  new ONTOWalletAdapter(),
  new BloctoWalletAdapter({ bloctoAppId:'6d85f56e-5f2e-46cd-b5f2-5cf9695b4d46' }), /** Must provide bloctoAppId **/
  new SafePalWalletAdapter(),
  new FoxWalletAdapter(),
  new CloverWalletAdapter(),
  new SpacecyWalletAdapter()
];

const App: React.FC = () => {
  return (
    <WalletProvider
      wallets={wallets}
      autoConnect={true | false} /** allow auto wallet connection or not **/
      onError={(error: Error) => {
        console.log('Handle Error Message', error);
      }}>
      {/* your website */}
    </WalletProvider>
  );
};

export default App;
```

# Web3 Hook

```typescript
import { useWallet } from '@amnis_finance/aptos-wallet-adapter';

const { connected, account, network, ...rest } = useWallet();

/*
  ** Properties available: **

  wallets: Wallet[]; - Array of wallets
  wallet: Wallet | null; - Selected wallet
  account: AccountKeys | null; - Wallet info: address, 
  network: NetworkInfo - { name, chainId, api }
  publicKey, authKey
  connected: boolean; - check the website is connected yet
  connect(walletName: string): Promise<void>; - trigger connect popup
  disconnect(): Promise<void>; - trigger disconnect action
  signAndSubmitTransaction(
    transaction: TransactionPayload
  ): Promise<PendingTransaction>; - function to sign and submit the transaction to chain
*/
```

# Connect & Disconnect (updated @ 18/10/2022)

```typescript
import { AptosWalletName, useWallet } from "@amnis_finance/aptos-wallet-adapter"

...

const { connect, disconnect, connected } = useWallet();

/* No more manual connection required if you disable auto-connect mode while the previous select + connect will still work */

if (!connected) {
  return (
    <button
      onClick={() => {
        connect(walletName); // E.g. connecting to the Aptos official wallet
      }}
    >
      Connect
    </button>
  );
} else {
  return (
    <button
      onClick={() => {
        disconnect();
      }}
    >
      Disconnect
    </button>
  );
}
```

# Submit and sign transaction

**Request faucet**

```typescript
const { signAndSubmitTransaction } = useWallet();

const payload: Types.TransactionPayload = {
  type: 'entry_function_payload',
  function: `0x1::module_name::function_name`,
  type_arguments: [],
  arguments: [],
};
const result = await signAndSubmitTransaction(payload);
  if (result) {
    console.log('Transaction hash', result.hash)
    console.log('Transaction Success');
  }
```


