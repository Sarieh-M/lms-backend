import { Module } from "@nestjs/common";
import {MailerModule} from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";
import {EjsAdapter} from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { join } from "node:path";
import { MailService } from "./mail.service";


@Module({
    imports: [
        MailerModule.forRootAsync({
            inject:[ConfigService],
            useFactory: async (configService: ConfigService) => {
                return{
                    transport:{
                        host:configService.get<string>('SMTP_HOST'),
                        port:configService.get<number>('SMTP_PORT'),
                        secure:false,
                        auth:{
                            user: configService.get<string>('SMTP_USERNAME'),
                            pass:configService.get<string>('SMTP_PASSWORD'),
                        }   
                    },
                    template:{
                        dir: join(__dirname,'templates'),
                        adapter:new EjsAdapter({
                            inlineCssEnabled:true   
                        }),
                    }
                }
            }
        })
    ],
    controllers: [],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {
    
}