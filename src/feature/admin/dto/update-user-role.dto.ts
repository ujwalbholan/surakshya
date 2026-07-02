import { IsEnum } from 'class-validator';
import { Role } from 'src/feature/auth/dto/auth.dto';

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role!: Role;
}
