import express from "express";
import { joinWaitList } from "../controllers/waitList.js";

const router = express.Router();

router.post('/join-wait', joinWaitList)

export default router;
