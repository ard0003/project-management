import express from "express"
import { getUserWorkspaces } from "../controllers/workspaceController.js";
import { WorkspaceRole } from "@prisma/client";

const workspaceRouter = express.Router();

workspaceRouter.get('/', getUserWorkspaces)
workspaceRouter.post('/add-member',getUserWorkspaces)

export default workspaceRouter