// backend/src/routes/classRequests.routes.js
import express from 'express';
import { classRequestsController } from '../controllers/classRequests.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/permission.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('class_request:view:own', 'class_request:view:all', 'classes:view', 'board:view'), classRequestsController.getRequests);
router.post('/', checkPermission('class_request:create', 'classes:create'), classRequestsController.createRequest);
router.get('/:id/suggestions', checkPermission('class_request:manage', 'class_request:view:all', 'classes:edit'), classRequestsController.getSuggestions);
router.get('/:id', checkPermission('class_request:view:own', 'class_request:view:all', 'classes:view'), classRequestsController.getRequestDetail);
router.post('/:id/offers', checkPermission('class_request:manage', 'classes:edit'), classRequestsController.sendParallelOffers);
router.post('/:id/select-offer', checkPermission('class_request:select_offer', 'class_request:view:own', 'classes:edit'), classRequestsController.selectOffer);
router.post('/:id/direct-match', checkPermission('class_request:manage', 'classes:edit', 'class_request:select_offer'), classRequestsController.directMatch);
router.delete('/:id', checkPermission('class_request:manage', 'classes:edit', 'class_request:delete'), classRequestsController.deleteRequest);

export default router;
