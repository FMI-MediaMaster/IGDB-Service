import userController from '@controllers/user';
import { Router } from 'express';
import { createRouter } from '@media-master/express-crud-router';

const routes: Router = Router();

routes.use('/users', createRouter(userController));

export default routes;

