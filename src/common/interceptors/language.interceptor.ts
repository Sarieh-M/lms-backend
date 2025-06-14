import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

   
    const lang = request.headers['lang'] || request.headers['language']  ||'en';

   
    request.lang = lang.toLowerCase() === 'ar' ? 'ar' : 'en';

    return next.handle();
  }
}