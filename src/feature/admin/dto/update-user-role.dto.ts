import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn } from 'class-validator';
import { Role } from 'src/feature/auth/dto/auth.dto';

export class UpdateUserRolesDto {
  @ApiProperty({
    enum: Role,
    isArray: true,
    example: [Role.USER, Role.GUARDIAN],
  })
  @IsArray()
  @IsIn(Object.values(Role), { each: true })
  roles!: Role[];
}
