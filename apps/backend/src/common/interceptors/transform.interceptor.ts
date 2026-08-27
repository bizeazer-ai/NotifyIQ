import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { IApiResponse } from "../interfaces/api-response-interfaces.js";
import { map, Observable} from "rxjs";
import { settings } from "../../lib/constants/settings.js"

export class TransformInterceptor<T> implements NestInterceptor<T, IApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<IApiResponse<T>> {
        const response = context.switchToHttp().getResponse();
        const startTime = Date.now();
        return next.handle().pipe(map(data=>({
            success: true,
            message: data?.message || "Operation successful",
            data: data?.data || data,
            timestamp: new Date().toISOString(),
            statusCode: response.statusCode,
            executionTimems: Date.now() - startTime
        })))
    }
}