
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubscribeDTO {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  honeypot: string;
}
