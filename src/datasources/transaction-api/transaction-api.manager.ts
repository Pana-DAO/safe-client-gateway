import { Inject, Injectable } from '@nestjs/common';
import { IConfigurationService } from '@/config/configuration.service.interface';
import { CacheFirstDataSource } from '@/datasources/cache/cache.first.data.source';
import {
  CacheService,
  ICacheService,
} from '@/datasources/cache/cache.service.interface';
import { HttpErrorFactory } from '@/datasources/errors/http-error-factory';
import {
  INetworkService,
  NetworkService,
} from '@/datasources/network/network.service.interface';
import { TransactionApi } from '@/datasources/transaction-api/transaction-api.service';
import { Chain } from '@/domain/chains/entities/chain.entity';
import { IConfigApi } from '@/domain/interfaces/config-api.interface';
import { ITransactionApiManager } from '@/domain/interfaces/transaction-api.manager.interface';
import { RpcUriAuthentication } from '../../domain/chains/entities/rpc-uri-authentication.entity';
import { Chain as ChainClass } from '../../routes/chains/entities/chain.entity';

@Injectable()
export class TransactionApiManager implements ITransactionApiManager {
  private transactionApiMap: Record<string, TransactionApi> = {};

  private readonly useVpcUrl: boolean;

  constructor(
    @Inject(IConfigurationService)
    private readonly configurationService: IConfigurationService,
    @Inject(IConfigApi) private readonly configApi: IConfigApi,
    private readonly dataSource: CacheFirstDataSource,
    @Inject(CacheService) private readonly cacheService: ICacheService,
    private readonly httpErrorFactory: HttpErrorFactory,
    @Inject(NetworkService) private readonly networkService: INetworkService,
  ) {
    this.useVpcUrl = this.configurationService.getOrThrow<boolean>(
      'safeTransaction.useVpcUrl',
    );
  }

  async getTransactionApi(chainId: string): Promise<TransactionApi> {
    const transactionApi = this.transactionApiMap[chainId];
    if (transactionApi !== undefined) return transactionApi;
    
    const customTxService = this.configurationService.getOrThrow<string>('transactionServiceUrl')
    //const chain: Chain = await this.configApi.getChain(chainId);

    const chain: Chain = {...new ChainClass(
      '42170', //chain.chainId,
      'Arbitrum Nova',
      'Arbitrum Nova',
      true,
      { name: 'Ethereum', decimals: 18, logoUri: '', symbol: 'ETH' },
      customTxService,
      {
        address: "https://nova.arbiscan.io/address/{{address}}",
        txHash: "https://nova.arbiscan.io/tx/{{txHash}}",
        api: "https://api.nova.arbiscan.io/api?module={{module}}&action={{action}}&address={{address}}&apiKey={{apiKey}}"
      },
      [],
      [],
      [{
        type: "oracle",
        uri: "https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=JNFAU892RF9TJWBU3EV7DJCPIWZY8KEMY1",
        gasParameter: "FastGasPrice",
        gweiFactor: "1000000000.000000000"
      }],
      {
        authentication: RpcUriAuthentication.NoAuthentication,
        value: 'https://nova.arbitrum.io/rpc'
      },
      {
        authentication: RpcUriAuthentication.NoAuthentication,
        value: 'https://nova.arbitrum.io/rpc'
      },
      {
        authentication: RpcUriAuthentication.NoAuthentication,
        value: 'https://nova.arbitrum.io/rpc'
      },
      'ArbN',
      {
        textColor: "#ffffff",
        backgroundColor: "#ef8220"
      },
      null,
    ), vpcTransactionService: 'http://nginx:8000/txs', recommendedMasterCopyVersion: '1.3.0'};

    this.transactionApiMap[chainId] = new TransactionApi(
      chainId,
      this.useVpcUrl ? chain.vpcTransactionService : chain.transactionService,
      this.dataSource,
      this.cacheService,
      this.configurationService,
      this.httpErrorFactory,
      this.networkService,
    );
    return this.transactionApiMap[chainId];
  }
}
