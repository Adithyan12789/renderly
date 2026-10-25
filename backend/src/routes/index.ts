import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { healthRouter } from './health.routes.js'
import { projectsRouter } from './projects.routes.js'
import { rendersRouter } from './renders.routes.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/projects', projectsRouter)
apiRouter.use('/renders', rendersRouter)
