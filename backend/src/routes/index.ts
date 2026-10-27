import { Router } from 'express'
import { adminRouter } from './admin.routes.js'
import { authRouter } from './auth.routes.js'
import { healthRouter } from './health.routes.js'
import { projectsRouter } from './projects.routes.js'
import { rendersRouter } from './renders.routes.js'
import { subscriptionsRouter } from './subscriptions.routes.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/projects', projectsRouter)
apiRouter.use('/renders', rendersRouter)
apiRouter.use('/subscriptions', subscriptionsRouter)
apiRouter.use('/admin', adminRouter)
