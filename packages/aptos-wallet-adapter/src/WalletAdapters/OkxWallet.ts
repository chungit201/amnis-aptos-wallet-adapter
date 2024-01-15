import { Types } from 'aptos';
import {
  WalletAccountChangeError,
  WalletDisconnectionError,
  WalletGetNetworkError,
  WalletNetworkChangeError,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletSignAndSubmitMessageError,
  WalletSignMessageError,
  WalletSignTransactionError
} from '../WalletProviders/errors';
import {
  AccountKeys,
  BaseWalletAdapter,
  NetworkInfo,
  scopePollingDetectionStrategy,
  SignMessagePayload,
  SignMessageResponse,
  WalletAdapterNetwork,
  WalletName,
  WalletReadyState
} from './BaseAdapter';

interface IApotsErrorResult {
  code: number;
  name: string;
  message: string;
}

type AddressInfo = { address: string; publicKey: string; authKey?: string };

interface OKXProvider {
  connect: () => Promise<AddressInfo>;
  account: () => Promise<AddressInfo>;
  isConnected: () => Promise<boolean>;

  signAndSubmitTransaction(
    transaction: any,
    options?: any
  ): Promise<{ hash: Types.HexEncodedBytes } | IApotsErrorResult>;

  signTransaction(transaction: any, options?: any): Promise<Uint8Array | IApotsErrorResult>;

  signMessage(message: SignMessagePayload): Promise<SignMessageResponse>;

  disconnect(): Promise<void>;

  network(): Promise<WalletAdapterNetwork>;

  requestId: Promise<number>;
  onAccountChange: (listener: (newAddress: AddressInfo) => void) => void;
  onNetworkChange: (listener: (network: { networkName: string }) => void) => void;
}

interface IAptosWallet {
  aptos?: OKXProvider;
}

interface OKXWindow extends Window {
  okxwallet?: IAptosWallet;
  aptos?: IAptosWallet;
}

declare const window: OKXWindow;

export const OKXWalletName = 'OKX Wallet' as WalletName<'OKX Wallet'>;

export interface OKXWalletAdapterConfig {
  provider?: IAptosWallet;
  // network?: WalletAdapterNetwork;
  timeout?: number;
}

export class OKXWalletAdapter extends BaseWalletAdapter {
  name = OKXWalletName;
  private networkToChainId = {
    mainnet: 1
  };
  url = 'https://okx.com/web3/';

  icon =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJDSURBVHgB7Zq9jtpAEMfHlhEgQLiioXEkoAGECwoKxMcTRHmC5E3IoyRPkPAEkI7unJYmTgEFTYwA8a3NTKScLnCHN6c9r1e3P2llWQy7M/s1Gv1twCP0ej37dDq9x+Zut1t3t9vZjDEHIiSRSPg4ZpDL5fxkMvn1cDh8m0wmfugfO53OoFQq/crn8wxfY9EymQyrVCqMfHvScZx1p9ls3pFxXBy/bKlUipGPrVbLuQqAfsCliq3zl0H84zwtjQrOw4Mt1W63P5LvBm2d+Xz+YzqdgkqUy+WgWCy+Mc/nc282m4FqLBYL+3g8fjDxenq72WxANZbLJeA13zDX67UDioL5ybXwafMYu64Ltn3bdDweQ5R97fd7GyhBQMipx4POeEDHIu2LfDdBIGGz+hJ9CQ1ABjoA2egAZPM6AgiCAEQhsi/C4jHyPA/6/f5NG3Ks2+3CYDC4aTccDrn6ojG54MnEvG00GoVmWLIRNZ7wTCwDHYBsdACy0QHIhiuRETxlICWpMMhGZHmqS8qH6JLyGegAZKMDkI0uKf8X4SWlaZo+Pp1bRrwlJU8ZKLIvUjKh0WiQ3sRUbNVq9c5Ebew7KEo2m/1p4jJ4qAmDaqDQBzj5XyiAT4VCQezJigAU+IDU+z8vJFnGWeC+bKQV/5VZ71FV6L7PA3gg3tXrdQ+DgLhC+75Wq3no69P3MC0NFQpx2lL04Ql9gHK1bRDjsSBIvScBnDTk1WrlGIZBorIDEYJj+rhdgnQ67VmWRe0zlplXl81vcyEt0rSoYDUAAAAASUVORK5CYII=';

  protected _provider: IAptosWallet | undefined;

  protected _network: WalletAdapterNetwork;

  protected _chainId: any;

  protected _api: string;

  protected _timeout: number;

  protected _readyState: WalletReadyState =
    typeof window === 'undefined' || typeof document === 'undefined'
      ? WalletReadyState.Unsupported
      : WalletReadyState.NotDetected;

  protected _connecting: boolean;

  protected _wallet: any | null;

  constructor({
    // provider,
    // network = WalletAdapterNetwork.Testnet,
    timeout = 10000
  }: OKXWalletAdapterConfig = {}) {
    super();
    this._provider = typeof window !== 'undefined' ? window?.okxwallet : undefined;
    this._network = undefined;
    this._timeout = timeout;
    this._connecting = false;
    this._wallet = null;

    if (typeof window !== 'undefined' && this._readyState !== WalletReadyState.Unsupported) {
      scopePollingDetectionStrategy(() => {
        if (window.okxwallet) {
          this._readyState = WalletReadyState.Installed;
          this.emit('readyStateChange', this._readyState);
          return true;
        }
        return false;
      });
    }
  }

  get publicAccount(): AccountKeys {
    return {
      publicKey: this._wallet?.publicKey || null,
      address: this._wallet?.address || null,
      authKey: this._wallet?.authKey || null
    };
  }

  get network(): NetworkInfo {
    return {
      name: this._network,
      api: this._api,
      chainId: this._chainId
    };
  }

  get connecting(): boolean {
    return this._connecting;
  }

  async account(): Promise<AddressInfo> {
    const response = await this._provider?.aptos?.account();
    if (!response) throw `${OKXWalletName} Account Error`;
    return response;
  }

  get connected(): boolean {
    return !!this._wallet?.isConnected;
  }

  get readyState(): WalletReadyState {
    return this._readyState;
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return;
      if (
        !(
          this._readyState === WalletReadyState.Loadable ||
          this._readyState === WalletReadyState.Installed
        )
      )
        throw new WalletNotReadyError();
      this._connecting = true;

      const provider = this._provider || window?.okxwallet;
      const isConnected = await provider?.aptos?.isConnected();

      if (isConnected) {
        await provider?.aptos?.disconnect();
      }

      const response = await provider?.aptos?.connect();

      if (!response) {
        this._connecting = false;
        throw new WalletNotConnectedError('No connect response');
      }

      const walletAccount = await provider?.aptos?.account();
      if (walletAccount) {
        this._wallet = {
          ...walletAccount,
          isConnected: true
        };

        try {
          const response = await this._provider?.aptos?.network();
          const api = null;
          this._network = response;
          this._chainId = this.networkToChainId;
          this._api = api;
        } catch (error: any) {
          const errMsg = error.message;
          this.emit('error', new WalletGetNetworkError(errMsg));
          throw error;
        }
      }
      this.emit('connect', this._wallet?.address || '');
    } catch (error: any) {
      console.log('connectError', error);
      this.emit('error', new Error(error));
      this._connecting = false;
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    const wallet = this._wallet;
    const provider = this._provider || window.okxwallet;
    if (wallet) {
      this._wallet = null;

      try {
        await provider?.aptos?.disconnect();
      } catch (error: any) {
        this.emit('error', new WalletDisconnectionError(error?.message, error));
      }
    }
    this.emit('disconnect');
  }

  async signTransaction(transaction: Types.TransactionPayload, options?: any): Promise<Uint8Array> {
    try {
      const wallet = this._wallet;
      const provider = this._provider || window?.okxwallet;
      if (!wallet || !provider) throw new WalletNotConnectedError();

      const response = await provider?.aptos.signTransaction(transaction, options);
      if ((response as IApotsErrorResult).code) {
        throw new Error((response as IApotsErrorResult).message);
      }
      return response as Uint8Array;
    } catch (error: any) {
      const errMsg = error.message;
      this.emit('error', new WalletSignTransactionError(errMsg));
      throw error;
    }
  }

  async signAndSubmitTransaction(
    transaction: Types.TransactionPayload,
    options?: any
  ): Promise<{ hash: Types.HexEncodedBytes }> {
    try {
      const wallet = this._wallet;
      const provider = this._provider || window?.okxwallet;
      if (!wallet || !provider) throw new WalletNotConnectedError();

      const response = await provider?.aptos.signAndSubmitTransaction(transaction, options);
      if ((response as IApotsErrorResult).code) {
        throw new Error((response as IApotsErrorResult).message);
      }
      return response as { hash: Types.HexEncodedBytes };
    } catch (error: any) {
      const errMsg = error.message;
      this.emit('error', new WalletSignAndSubmitMessageError(errMsg));
      throw error;
    }
  }

  async signMessage(msgPayload: SignMessagePayload): Promise<SignMessageResponse> {
    try {
      const wallet = this._wallet;
      const provider = this._provider || window.okxwallet;
      if (!wallet || !provider) throw new WalletNotConnectedError();
      if (typeof msgPayload !== 'object' || !msgPayload.nonce) {
        throw new WalletSignMessageError('Invalid signMessage Payload');
      }
      const response = await provider?.aptos?.signMessage(msgPayload);
      if (response) {
        return response;
      } else {
        throw new Error('Sign Message failed');
      }
    } catch (error: any) {
      const errMsg = error.message;
      this.emit('error', new WalletSignMessageError(errMsg));
      throw error;
    }
  }

  async onAccountChange(): Promise<void> {
    try {
      const wallet = this._wallet;
      const provider = this._provider || window.okxwallet;
      if (!wallet || !provider) throw new WalletNotConnectedError();
      const handleAccountChange = async (newAccount: AddressInfo) => {
        if (newAccount?.publicKey) {
          this._wallet = {
            ...this._wallet,
            publicKey: newAccount.publicKey || this._wallet?.publicKey,
            authKey: newAccount.authKey || this._wallet?.authKey,
            address: newAccount.address || this._wallet?.address
          };
        } else {
          const response = await provider?.aptos?.connect();
          this._wallet = {
            ...this._wallet,
            authKey: response?.authKey || this._wallet?.authKey,
            address: response?.address || this._wallet?.address,
            publicKey: response?.publicKey || this._wallet?.publicKey
          };
        }
        this.emit('accountChange', newAccount.publicKey);
      };
      await provider?.aptos?.onAccountChange(handleAccountChange);
    } catch (error: any) {
      const errMsg = error.message;
      this.emit('error', new WalletAccountChangeError(errMsg));
      throw error;
    }
  }

  async onNetworkChange(): Promise<void> {
    try {
      const wallet = this._wallet;
      const provider = this._provider || window.okxwallet;
      if (!wallet || !provider) throw new WalletNotConnectedError();
      const handleNetworkChange = async (newNetwork: { networkName: WalletAdapterNetwork }) => {
        this._network = newNetwork.networkName;
        this.emit('networkChange', this._network);
      };
      await provider?.aptos?.onNetworkChange(handleNetworkChange);
    } catch (error: any) {
      const errMsg = error.message;
      this.emit('error', new WalletNetworkChangeError(errMsg));
      throw error;
    }
  }
}
