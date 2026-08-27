// apps/backend/src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { IApiErrorResponse } from '../interfaces/api-response-interfaces';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const startTime = (request as any).startTime || Date.now();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';

    // Handle explicit NestJS HttpExceptions (e.g. BadRequestException, NotFoundException)
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const resBody = exception.getResponse() as any;
      
      message = resBody?.message || exception.message;
      error = resBody?.error || exception.name;
    } 
    // Example: Cleanly catch validation errors or unexpected operational failures
    else if (exception instanceof Error) {
      // In development, you might want to log this out to your terminal container stream
      console.error('💥 Unhandled Runtime Exception:', exception);
      
      message = exception.message;
      error = exception.name;
    }

    const errorPayload: IApiErrorResponse = {
      success: false,
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
      executionTimems: Date.now() - startTime || 0,
    };

    response.status(statusCode).json(errorPayload);
  }
}
