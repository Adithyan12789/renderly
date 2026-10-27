import { z } from 'zod'

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    CLIENT_ORIGINS: z.string().default('http://localhost:3000'),
    MONGODB_URI: z.string().trim().optional(),
    OPENAI_API_KEY: z.string().trim().optional(),
    STABILITY_API_KEY: z.string().trim().optional(),
    TRIPO_API_KEY: z.string().trim().optional(),
    AI_IMAGE_PROVIDER: z.enum(['auto', 'openai', 'stability', 'pollinations']).default('auto'),
    RAZORPAY_KEY_ID: z.string().trim().default('rzp_test_Oks5Gpac00wL72'),
    RAZORPAY_KEY_SECRET: z.string().trim().optional(),
    ADMIN_SECRET_CODE: z.string().trim().default('192167'),
    ADMIN_RECOVERY_EMAIL: z.string().trim().email().default('adithiruthiparambil12@gmail.com'),
    EMAIL_USER: z.string().trim().default('adithiruthiparambil12@gmail.com'),
    EMAIL_PASS: z.string().trim().default('iyxv lgjs znvl uocz'),
  })
  .refine((env) => env.NODE_ENV !== 'production' || Boolean(env.MONGODB_URI), {
    message: 'MONGODB_URI is required in production',
    path: ['MONGODB_URI'],
  })

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment configuration:', z.flattenError(parsed.error).fieldErrors)
  process.exit(1)
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  clientOrigins: parsed.data.CLIENT_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}
