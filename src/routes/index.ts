import { Router } from 'express';
import igdbController from '@controllers/igdb';

const routes: Router = Router();

routes.use('/:method', igdbController.handler);

export default routes;
