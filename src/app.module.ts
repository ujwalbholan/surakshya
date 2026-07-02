import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './feature/user/user.module';
import { AuthModule } from './feature/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './utils/strategies/jwt.strategy';
import { RolesGuard } from './utils/guard/roles.guard';
import { DeviceModule } from './feature/device/device.module';
import { TrackingModule } from './feature/tracking/tracking.module';
import { NotificationModule } from './feature/notification/notification.module';
import { GuardianModule } from './feature/guardian/guardian.module';
import { AdminModule } from './feature/admin/admin.module';
import { MqttModule } from './feature/mqtt/mqtt.module';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: isProduction,
      envFilePath: ['.local.env', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const sslEnabled = configService.get<string>('DB_SSL') === 'true';

        return {
          type: 'postgres',
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: configService.get<string>('DB_HOST'),
                port: Number(configService.get<string>('DB_PORT')),
                username: configService.get<string>('DB_USERNAME'),
                password: configService.get<string>('DB_PASSWORD'),
                database: configService.get<string>('DB_NAME'),
              }),
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get<string>('DB_SYNC') === 'true',
          logging: configService.get<string>('DB_LOGGING') === 'true',
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    DeviceModule,
    TrackingModule,
    PassportModule,
    NotificationModule,
    AdminModule,
    GuardianModule,
    MqttModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy, RolesGuard],
  exports: [AppService],
})
export class AppModule {}
