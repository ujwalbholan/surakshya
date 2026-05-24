import { Injectable } from '@nestjs/common';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async register(registerDto: RegisterDto) {
    const { id, full_name, email, phone, role } =
      await this.userService.register(registerDto);

    return {
      message: 'User Registered successfully',
      user_id: id,
      full_name: full_name,
      email: email,
      phone: phone,
      role: role,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.login(loginDto);

    return user;
  }

  refresh() {}

  logout() {}
}
