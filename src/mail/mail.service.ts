import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, RequestTimeoutException } from "@nestjs/common";
import { existsSync } from "node:fs";
import { join } from "node:path";





@Injectable()
export class MailService{
    constructor(private readonly mailerService: MailerService) { }


/**
 * Sending Email after user Login in his Account
 * @param email the logged in user
 */
    public async sendLoginEmail(email:string){
        try{
            const today = new Date();
            await this.mailerService.sendMail({
                to: email,
                from:`<no-replay@my-nestjs-app.com>`,
                subject: 'Login to your account',
                template: 'login',
                context: {
                    email,today
                }
            })
        }catch(err){
            console.log(err);
            throw new RequestTimeoutException("Something went wrong, please try again later");
        }
    }

    /**
     * sending verfiy email template
     * @param email email of the registered user
     * @param link link with id of the user and verification token
     */
    public async sendVerifyEmailTemplate(email:string,link:string){
        try{
            await this.mailerService.sendMail({
                to:email,
                from:`<no-replay@my-nestjs-app.com>`,
                subject: 'Verify your account',
                template: 'verify-email.ejs',
                context:{link}
            })
        }catch(error){
            // console.log("#####################################################################")
            // console.log(join(__dirname));
            // console.log(join(__dirname,"templates"));
            // console.log("#####################################################################")
            console.log(error);
            throw new RequestTimeoutException("SomeThing went wrong, please try again later");
        }
    }


    public async sendRestPasswordTemplate(email:string,restPasswordLink:string){
        try{
            await this.mailerService.sendMail({
                to:email,
                from:`<no-replay@my-nestjs-app.com>`,
                subject: 'Reset your password',
                template: 'reset-password',
                context:{restPasswordLink}
            })
        }catch(error){
            console.log(error);
            throw new RequestTimeoutException("SomeThing went wrong, please try again later");
        }
    }

}



