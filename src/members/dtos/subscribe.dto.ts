
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SubscribeDTO {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
