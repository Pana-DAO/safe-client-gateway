import { Inject, Injectable } from '@nestjs/common';
import { IConfigurationService } from '@/config/configuration.service.interface';
import { IBackboneRepository } from '@/domain/backbone/backbone.repository.interface';
import { Backbone } from '@/domain/backbone/entities/backbone.entity';
import { IChainsRepository } from '@/domain/chains/chains.repository.interface';
import { MasterCopy } from '@/domain/chains/entities/master-copies.entity';
import { Page } from '@/domain/entities/page.entity';
import { AboutChain } from '@/routes/chains/entities/about-chain.entity';
import { Chain } from '@/routes/chains/entities/chain.entity';
import {
  PaginationData,
  cursorUrlFromLimitAndOffset,
} from '@/routes/common/pagination/pagination.data';
import { RpcUriAuthentication } from '../../domain/chains/entities/rpc-uri-authentication.entity';

@Injectable()
export class ChainsService {
  constructor(
    @Inject(IConfigurationService)
    private readonly configurationService: IConfigurationService,
    @Inject(IChainsRepository)
    private readonly chainsRepository: IChainsRepository,
    @Inject(IBackboneRepository)
    private readonly backboneRepository: IBackboneRepository,
  ) {}

  async getChains(
    routeUrl: Readonly<URL>,
    paginationData: PaginationData,
  ): Promise<Page<Chain>> {
    const result = await this.chainsRepository.getChains(
      paginationData.limit,
      paginationData.offset,
    );

    const nextURL = cursorUrlFromLimitAndOffset(routeUrl, result.next);
    const previousURL = cursorUrlFromLimitAndOffset(routeUrl, result.previous);
    const customTxService = this.configurationService.getOrThrow<string>('transactionServiceUrl')
    const chains = [1].map(
      (chain) =>
        new Chain(
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
        ),
    );

    return <Page<Chain>>{
      count: result.count,
      next: nextURL?.toString() ?? null,
      previous: previousURL?.toString() ?? null,
      results: chains,
    };
  }

  async getChain(chainId: string): Promise<Chain> {
    const result = await this.chainsRepository.getChain(chainId);
    return new Chain(
      result.chainId,
      result.chainName,
      result.description,
      result.l2,
      result.nativeCurrency,
      result.transactionService,
      result.blockExplorerUriTemplate,
      result.disabledWallets,
      result.features,
      result.gasPrice,
      result.publicRpcUri,
      result.rpcUri,
      result.safeAppsRpcUri,
      result.shortName,
      result.theme,
      result.ensRegistryAddress,
    );
  }

  async getAboutChain(chainId: string): Promise<AboutChain> {
    const chain = await this.chainsRepository.getChain(chainId);

    return new AboutChain(
      chain.transactionService,
      this.configurationService.getOrThrow<string>('about.name'),
      this.configurationService.getOrThrow<string>('about.version'),
      this.configurationService.getOrThrow<string>('about.buildNumber'),
    );
  }

  async getBackbone(chainId: string): Promise<Backbone> {
    return this.backboneRepository.getBackbone(chainId);
  }

  async getMasterCopies(chainId: string): Promise<MasterCopy[]> {
    const result = await this.chainsRepository.getMasterCopies(chainId);

    const masterCopies = Promise.all(
      result.map(
        async (masterCopy) =>
          <MasterCopy>{
            address: masterCopy.address,
            version: masterCopy.version,
          },
      ),
    );

    return masterCopies;
  }
}
