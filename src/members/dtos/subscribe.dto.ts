
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { isSet } from 'util/types';

export class SubscribeDTO {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  honeypot: any;
}
