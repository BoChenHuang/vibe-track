import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('system')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns service liveness status.',
  })
  @ApiOkResponse({ schema: { example: { status: 'ok' } } })
  health(): { status: string } {
    return { status: 'ok' };
  }
}
