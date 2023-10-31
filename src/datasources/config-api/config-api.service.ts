import { Inject, Injectable } from '@nestjs/common';
import { IConfigurationService } from '@/config/configuration.service.interface';
import { CacheFirstDataSource } from '@/datasources/cache/cache.first.data.source';
import { CacheRouter } from '@/datasources/cache/cache.router';
import {
  CacheService,
  ICacheService,
} from '@/datasources/cache/cache.service.interface';
import { HttpErrorFactory } from '@/datasources/errors/http-error-factory';
import { Chain } from '@/domain/chains/entities/chain.entity';
import { Page } from '@/domain/entities/page.entity';
import { IConfigApi } from '@/domain/interfaces/config-api.interface';
import { SafeApp } from '@/domain/safe-apps/entities/safe-app.entity';
import { Chain as ChainClass } from '../../routes/chains/entities/chain.entity';
import { RpcUriAuthentication } from '../../domain/chains/entities/rpc-uri-authentication.entity';
import { SafeAppAccessControlPolicies } from '../../domain/safe-apps/entities/safe-app-access-control.entity';


@Injectable()
export class ConfigApi implements IConfigApi {
  private readonly baseUri: string;
  private readonly defaultExpirationTimeInSeconds: number;
  private readonly defaultNotFoundExpirationTimeSeconds: number;

  constructor(
    private readonly dataSource: CacheFirstDataSource,
    @Inject(CacheService) private readonly cacheService: ICacheService,
    @Inject(IConfigurationService)
    private readonly configurationService: IConfigurationService,
    private readonly httpErrorFactory: HttpErrorFactory,
  ) {
    this.baseUri =
      this.configurationService.getOrThrow<string>('safeConfig.baseUri');
    this.defaultExpirationTimeInSeconds =
      this.configurationService.getOrThrow<number>(
        'expirationTimeInSeconds.default',
      );
    this.defaultNotFoundExpirationTimeSeconds =
      this.configurationService.getOrThrow<number>(
        'expirationTimeInSeconds.notFound.default',
      );
  }

  async getChains(args: {
    limit?: number;
    offset?: number;
  }): Promise<Page<Chain>> {
    try {
      const url = `${this.baseUri}/api/v1/chains`;
      const params = { limit: args.limit, offset: args.offset };
      const cacheDir = CacheRouter.getChainsCacheDir(args);
      return await this.dataSource.get({
        cacheDir,
        url,
        notFoundExpireTimeSeconds: this.defaultNotFoundExpirationTimeSeconds,
        networkRequest: { params },
        expireTimeSeconds: this.defaultExpirationTimeInSeconds,
      });
    } catch (error) {
      throw this.httpErrorFactory.from(error);
    }
  }

  async clearChains(): Promise<void> {
    const pattern = CacheRouter.getChainsCachePattern();
    await Promise.all([
      this.cacheService.deleteByKey(CacheRouter.getChainsCacheKey()),
      this.cacheService.deleteByKeyPattern(pattern),
    ]);
  }

  async getChain(chainId: string): Promise<Chain> {
    try {
      const url = `${this.baseUri}/api/v1/chains/${chainId}`;
      const cacheDir = CacheRouter.getChainCacheDir(chainId);
      const customTxService = this.configurationService.getOrThrow<string>('transactionServiceUrl')
      return {
        ...new ChainClass(
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
        ), vpcTransactionService: '', recommendedMasterCopyVersion: '1.3.'
      }
    } catch (error) {
      throw this.httpErrorFactory.from(error);
    }
  }

  async clearChain(chainId: string): Promise<void> {
    await Promise.all([
      this.cacheService.deleteByKey(CacheRouter.getChainCacheKey(chainId)),
      this.cacheService.deleteByKey(CacheRouter.getChainsCacheKey()),
    ]);
  }

  async getSafeApps(args: {
    chainId?: string;
    clientUrl?: string;
    url?: string;
  }): Promise<SafeApp[]> {
    try {
      const providerUrl = `${this.baseUri}/api/v1/safe-apps/`;
      const params = {
        chainId: args.chainId,
        clientUrl: args.clientUrl,
        url: args.url,
      };
      const cacheDir = CacheRouter.getSafeAppsCacheDir(args);
      return [{
        id: 29,
        url: "https://apps-portal.safe.global/tx-builder",
        name: "Transaction Builder",
        iconUrl: "https://apps-portal.safe.global/tx-builder/tx-builder.png",
        description: "Compose custom contract interactions and batch them into a single transaction",
        chainIds: [
          42170
        ],
        provider: null,
        accessControl: {
          type: SafeAppAccessControlPolicies.NoRestrictions,
          value: null
        },
        tags: [
          "dashboard-widgets",
          "Infrastructure",
          "transaction-builder"
        ],
        features: [
          "BATCHED_TRANSACTIONS"
        ],
        developerWebsite: "https://safe.global",
        socialProfiles: [
          {
            platform: "DISCORD",
            url: "https://chat.safe.global"
          },
          {
            platform: "GITHUB",
            url: "https://github.com/safe-global"
          },
          {
            platform: "TWITTER",
            url: "https://twitter.com/safe"
          }
        ]
      }]
    } catch (error) {
      throw this.httpErrorFactory.from(error);
    }
  }

  async clearSafeApps(chainId?: string): Promise<void> {
    if (chainId) {
      // if a chain id is provided, delete the safe apps data for that chain id
      await this.cacheService.deleteByKey(CacheRouter.getSafeAppsKey(chainId));
    } else {
      // if a chain id is not provided, delete all the safe apps data
      const pattern = CacheRouter.getSafeAppsCachePattern();
      await this.cacheService.deleteByKeyPattern(pattern);
    }
  }
}
