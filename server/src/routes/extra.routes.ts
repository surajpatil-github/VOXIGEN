import { Router } from 'express';
import { extraController } from '../controllers/extra.controller';

const router = Router();

router.get('/panchang/today', extraController.getPanchang.bind(extraController));
router.get('/horoscope/daily', extraController.getHoroscope.bind(extraController));
router.post('/compatibility/calculate', extraController.calculateCompatibility.bind(extraController));

export default router;
