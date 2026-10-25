import { Router } from 'express'
import { databaseStatus } from '../config/db.js'
import { sendSuccess } from '../utils/respond.js'

export const healthRouter = Router()

healthRouter.get('/', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    database: databaseStatus(),
    uptimeSeconds: Math.round(process.uptime()),
  })
})
