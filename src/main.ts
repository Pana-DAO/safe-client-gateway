import { AppModule } from '@/app.module';
import { DefaultAppProvider } from '@/app.provider';
import { IConfigurationService } from '@/config/configuration.service.interface';

async function bootstrap() {
  const app = await new DefaultAppProvider().provide(AppModule);

  const configurationService: IConfigurationService =
    app.get<IConfigurationService>(IConfigurationService);
  const applicationPort: string =
    configurationService.getOrThrow('applicationPort');
  
  app.enableCors();
  await app.listen(applicationPort);
}

bootstrap();
