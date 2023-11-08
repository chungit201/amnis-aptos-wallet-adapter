import { HexString, MaybeHexString, Types } from 'aptos';
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
  SignMessagePayload,
  SignMessageResponse,
  WalletAdapterNetwork,
  WalletName,
  WalletReadyState
} from './BaseAdapter';
import { Account, MSafeWallet } from '@msafe/aptos-wallet';

export const MSafeWalletName = 'MSafe' as WalletName<'MSafe'>;

interface MSafeAccount {
  address: MaybeHexString;
  publicKey: MaybeHexString[];
  authKey: MaybeHexString;
  minKeysRequired: number;
  isConnected: boolean;
}

export class MSafeWalletAdapter extends BaseWalletAdapter {
  name = MSafeWalletName;

  icon = 'data:image/png;base64,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';

  protected _provider: MSafeWallet | undefined;

  protected _network: WalletAdapterNetwork;

  protected _chainId: string;

  // MSafeWallet only works in msafe appstore iframe
  protected _readyState: WalletReadyState = MSafeWallet.inMSafeWallet()
    ? WalletReadyState.NotDetected
    : WalletReadyState.Unsupported;

  protected _connecting: boolean;

  protected _wallet: MSafeAccount | null;

  private _origin?: string | string[];

  /**
   * @description create a MSafeWalletAdapter
   * @param origin allowlist of msafe website url, omit means accpets all msafe websites. you can pass a single url or an array of urls.
   * @example
   *  // 1. Initialize MSafeWalletAdapter with default allowlist:
   *      new MSafeWalletAdapter();
   *  // 2. Initialize MSafeWalletAdapter with a single MSafe url:
   *      new MSafeWalletAdapter('https://app.m-safe.io');
   *  // 3. Initialize MSafeWalletAdapter with an array of MSafe urls:
   *      new MSafeWalletAdapter(['https://app.m-safe.io', 'https://testnet.m-safe.io', 'https://partner.m-safe.io']);
   *  // 4. Initialize MSafeWalletAdapter with a single network type:
   *      new MSafeWalletAdapter('Mainnet');
   *  // 5. Initialize MSafeWalletAdapter with an array of network types:
   *      new MSafeWalletAdapter(['Mainnet', 'Testnet', 'Partner']);
   */
  constructor(origin?: string | string[]) {
    super();
    this._network = undefined;
    this._connecting = false;
    this._origin = origin;
    if (this._readyState === WalletReadyState.NotDetected) {
      MSafeWallet.new(origin)
        .then((msafe) => {
          this._provider = msafe;
          this._readyState = WalletReadyState.Installed;
          this.emit('readyStateChange', this._readyState);
        })
        .catch((e) => {
          this._readyState = WalletReadyState.Unsupported;
          this.emit('readyStateChange', this._readyState);
          console.error('MSafe connect error:', e);
        });
    }
  }

  /// fix issue of next.js: access url via getter to avoid access window object in constructor
  get url() {
    return MSafeWallet.getAppUrl(this._origin instanceof Array ? this._origin[0] : this._origin);
  }

  get publicAccount(): AccountKeys {
    return {
      publicKey: this._wallet?.publicKey,
      address: this._wallet?.address,
      authKey: this._wallet?.authKey,
      minKeysRequired: this._wallet?.minKeysRequired
    };
  }

  get network(): NetworkInfo {
    return {
      name: this._network,
      chainId: this._chainId
    };
  }

  get connecting(): boolean {
    return this._connecting;
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

      const provider = this._provider;
      const isConnected = await provider?.isConnected();
      if (isConnected) {
        await provider?.disconnect();
      }
      const response = await provider?.connect();

      if (!response) {
        throw new WalletNotConnectedError('No connect response');
      }

      const walletAccount = await provider?.account();
      if (walletAccount) {
        this._wallet = {
          ...walletAccount,
          isConnected: true
        } as any;

        try {
          const name = await provider?.network();
          const chainId = await provider?.chainId();

          this._network = name as WalletAdapterNetwork;
          this._chainId = chainId.toString();
        } catch (error: any) {
          const errMsg = error.message;
          this.emit('error', new WalletGetNetworkError(errMsg));
          throw error;
        }
      }
      this.emit('connect', this._wallet?.address || '');
    } catch (error: any) {
      this.emit('error', new Error(error));
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    const wallet = this._wallet;
    const provider = this._provider;
    if (wallet) {
      this._wallet = null;

      try {
        await provider?.disconnect();
      } catch (error: any) {
        this.emit('error', new WalletDisconnectionError(error?.message, error));
      }
    }

    this.emit('disconnect');
  }

  async signTransaction(
    transactionPyld: Types.TransactionPayload,
    options?: any
  ): Promise<Uint8Array> {
    try {
      const wallet = this._wallet;
      const provider = this._provider;
      if (!wallet || !provider) throw new WalletNotConnectedError();
      const response = await provider.signTransaction(transactionPyld as any, options);

      if (!response) {
        throw new Error('No response');
      }
      return response;
    } catch (error: any) {
      this.emit('error', new WalletSignTransactionError(error));
      throw error;
    }
  }

  async signAndSubmitTransaction(
    transactionPyld: Types.TransactionPayload,
    options?: any
  ): Promise<{ hash: Types.HexEncodedBytes }> {
    try {
      const wallet = this._wallet;
      const provider = this._provider;
      if (!wallet || !provider) throw new WalletNotConnectedError();
      const response = await provider.signAndSubmit(transactionPyld as any, options);

      if (!response) {
        throw new Error('No response');
      }
      return { hash: HexString.fromUint8Array(response).hex() };
    } catch (error: any) {
      this.emit('error', new WalletSignAndSubmitMessageError(error));
      throw error;
    }
  }

  async signMessage(msgPayload: SignMessagePayload): Promise<SignMessageResponse> {
    try {
      const wallet = this._wallet;
      const provider = this._provider;
      if (!wallet || !provider) throw new WalletNotConnectedError();
      const response = await provider.signMessage(msgPayload as any);
      if (response) {
        return response as any;
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
      const provider = this._provider;
      if (!wallet || !provider) throw new WalletNotConnectedError();
      const handleChangeAccount = async (newAccount: Account) => {
        this._wallet = {
          ...this._wallet,
          ...newAccount
        };
        this.emit('accountChange', newAccount.address);
      };
      provider.onChangeAccount(handleChangeAccount);
    } catch (error: any) {
      const errMsg = error.message;
      this.emit('error', new WalletAccountChangeError(errMsg));
      throw error;
    }
  }

  async onNetworkChange(): Promise<void> {
    try {
      const wallet = this._wallet;
      const provider = this._provider;
      if (!wallet || !provider) throw new WalletNotConnectedError();
      const handleNetworkChange = async (newNetwork: WalletAdapterNetwork) => {
        this._network = newNetwork;
        this._chainId = (await this._provider.chainId()).toString();
        this.emit('networkChange', this._network);
      };
      provider.onChangeNetwork(handleNetworkChange);
    } catch (error: any) {
      const errMsg = error.message;
      this.emit('error', new WalletNetworkChangeError(errMsg));
      throw error;
    }
  }
}

/**
 * @deprecated Use `MSafeWalletName` instead.
 */
export const MsafeWalletName = MSafeWalletName;
/**
 * @deprecated Use `MSafeWalletAdapter` instead.
 */
export class MsafeWalletAdapter extends MSafeWalletAdapter {}
