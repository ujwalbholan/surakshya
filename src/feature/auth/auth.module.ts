import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from 'src/feature/user/entities/user.entity';
import { UserModule } from 'src/feature/user/user.module';
import { TokenModule } from 'src/utils/token/token.module';
import { RedisModule } from 'src/config/redis/redis.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UserModule,
    TokenModule,
    RedisModule,
    NotificationModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
