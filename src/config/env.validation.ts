import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  CLAUDE_API_KEY: Joi.string().required(),
  SPOTIFY_CLIENT_ID: Joi.string().required(),
  SPOTIFY_CLIENT_SECRET: Joi.string().required(),
  REDIS_URL: Joi.string().uri().required(),
  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug')
    .default('info'),
});
