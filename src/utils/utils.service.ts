
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const jwt = require('jsonwebtoken');

@Injectable()
export class UtilsService {
    constructor(
        private configService: ConfigService,
    ) {}
   
    public signToken(audience: string): string {
        const algorithm = this.getConfig('ghost.jwt_algorithm');
        const expiresIn = this.getConfig('ghost.jwt_expiration');
        const apiKey = this.getConfig('ghost.admin_api_key');
    
        const [id, secret] = apiKey.split(':');

        const token = jwt.sign({}, Buffer.from(secret, 'hex'), {
            keyid: id,
            algorithm,
            expiresIn,
            audience
        });
        return token;
    }

    public getConfig(key: string): string {
        return this.configService.get<string>(key);
    }
}
