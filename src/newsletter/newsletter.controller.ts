import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SubscribeDto } from './dto/subscribe.dto';
import { NewsletterService } from './newsletter.service';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.subscribe(dto.email);
  }
}
