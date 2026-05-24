import { Role } from 'src/auth/dto/auth.dto';

export class CreateUserDto {
  full_name!: string;
  email!: string;
  phone!: string;
  password!: string;
  role!: Role;
}
