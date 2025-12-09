import prisma from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";

// create task
export const createTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId, title, description, type, status, priority, assigneeId, due_date } = req.body;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } }
        });

        if (!project) {
            return res.status(404).json({ message: "project not found" });
        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "you dont have admin previleges " });
        } else if (assigneeId && !project.members.find((member) => member.user.id === assigneeId)) {
            return res.status(403).json({ message: "assigne is not a member of the project / workspace" });
        }

        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                priority,
                assigneeId,
                status,
                due_date: new Date(due_date)
            }
        });

        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: task.id },
            include: { assignee: true }
        })
        await inngest.send({
            name : "app/task.assigned",
            data:{
                taskId: task.id, origin
            }
        })
        res.json({ task: taskWithAssignee, message: "task created succesfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};


// update task
export const updateTask = async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id }
        });

        if (!task) {
            return res.status(404).json({ messgae: "task not found" });
        }

        const { userId } = await req.auth();

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } }
        });

        if (!project) {
            return res.status(404).json({ message: "project not found" });
        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "you dont have admin previleges for this project " });
        }

        // ❌ WRONG: prisma.update → ❌
        // ❌ WRONG: missing model: prisma.task.update → ✔
        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: req.body
        });

        res.json({ task: updatedTask, message: "task updated succesfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};


// delete task
export const deleteTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { tasksIds } = req.body;

        const tasks = await prisma.task.findMany({
            where: { id: { in: tasksIds } }
        });

        if (tasks.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await prisma.project.findUnique({
            where: { id: tasks[0].projectId },
            include: { members: { include: { user: true } } }
        });

        if (!project) {
            return res.status(404).json({ message: "project not found" });
        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "you dont have admin previleges for this project " });
        }

        // ❌ WRONG: where: { id: { id: tasksIds } }
        // ✔ FIXED:
        await prisma.task.deleteMany({
            where: { id: { in: tasksIds } }
        });

        res.json({ message: "Task deleted succesfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};
