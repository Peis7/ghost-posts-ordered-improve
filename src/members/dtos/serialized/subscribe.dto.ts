import { Expose } from 'class-transformer';

export class SubscribeSerializedDTO {
  @Expose()
  id: string;

  @Expose()
  email: string;
}