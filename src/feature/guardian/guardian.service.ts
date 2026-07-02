import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/feature/user/entities/user.entity';
import { GuardianLink } from './entities/guardian-link.entity';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { Role } from 'src/feature/auth/dto/auth.dto';

@Injectable()
export class GuardianService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GuardianLink)
    private readonly guardianLinkRepository: Repository<GuardianLink>,
  ) {}

  async addGuardian(childUserId: string, dto: CreateGuardianDto) {
    const child = await this.userRepository.findOneBy({ id: childUserId });

    if (!child || child.role !== Role.USER) {
      throw new BadRequestException('Only users can add guardians');
    }

    const email = dto.email.trim().toLowerCase();
    const phone = this.normalizePhone(dto.phone);

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (existingUser?.email === email) {
      throw new BadRequestException('Email already exists');
    }

    if (existingUser?.phone === phone) {
      throw new BadRequestException('Phone Number already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const guardian = await this.userRepository.save(
      this.userRepository.create({
        full_name: dto.full_name.trim(),
        email,
        phone,
        password_hash: passwordHash,
        role: Role.GUARDIAN,
      }),
    );

    await this.guardianLinkRepository.save(
      this.guardianLinkRepository.create({
        child_user_id: childUserId,
        guardian_user_id: guardian.id,
      }),
    );

    return {
      message: 'Guardian added successfully',
      guardian: this.toPublicUser(guardian),
    };
  }

  async getMyGuardians(
    childUserId: string,
    options: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    const skip = (options.page - 1) * options.limit;
    const [links, total] = await this.guardianLinkRepository.findAndCount({
      where: { child_user_id: childUserId },
      relations: ['guardian'],
      order: { created_at: 'DESC' },
      skip,
      take: options.limit,
    });

    return {
      message: 'Guardians retrieved successfully',
      guardians: links.map((link) => this.toPublicUser(link.guardian)),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getMyWard(
    guardianUserId: string,
    options: { page: number; limit: number } = { page: 1, limit: 20 },
  ) {
    const skip = (options.page - 1) * options.limit;
    const [links, total] = await this.guardianLinkRepository.findAndCount({
      where: { guardian_user_id: guardianUserId },
      relations: ['child'],
      order: { created_at: 'DESC' },
      skip,
      take: options.limit,
    });

    if (links.length === 0 && total === 0) {
      throw new NotFoundException('No wards linked to this guardian');
    }

    return {
      message: 'Wards retrieved successfully',
      wards: links.map((link) => this.toPublicUser(link.child)),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  private normalizePhone(phone: string): string {
    const trimmed = phone.trim();
    return trimmed.startsWith('+977') ? trimmed.slice(4) : trimmed;
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }
}
