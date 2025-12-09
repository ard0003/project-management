import { WorkspaceRole } from "@prisma/client";
import prisma from "../configs/prisma.js";


//  get all workspaces for user 
export const getUserWorkspaces = async(req, res)=> {
    try {
        const {userId} = await req.auth();
        const workspaces = await prisma.worksapce.findMany({
            where: {
                members: {some: {userId: userId}}
            },
            Include:{
                members: {include: {user:true}},
                projects:{
                    include:{
                        tasks:{include: {assignee:true, comments: {include:{user:true}}}},
                        members: {include : {user:true}}
                    }
                },
                owner:true


            }
        });
        res.json({workspaces})
    }catch (error){
        console.log(error);
        res.status(500).json({message: error.code || error.message })

    }
}

//  add member to workspace
export const addMember = async(req, res)=> {
    try{
        const {userId} = await req.auth();
        const {email, role, worksapceId ,message} = req.body;

        //check if user exists
        const user = await prisma.user.findUnique({where : {email}});
        
        if(!user){
            return res.status(404).json({message :"user not found"})
        }

        if(!worksapceId || !role){
            return res.status(404).json({message :"Missing  requried parameters"})
        }

        if(!["ADMIN" , "MEMBER"].includes(role)){
            return res.status(400).json({message : "Invalid role"})
        }
        // fetch workspace
        const workspace = await prisma.workspace.findUnique({where : {id:
            worksapceId},include : {members: true}})

        if(!worksapce){
            return res.status(404).json({message: "workspace not found"})
        }
        // check creator  has admin role
        if(!workspace.members.find((member)=>member.userId === userId && member.role === "ADMIN")){
            return res.status(401).json({message: "you dont have admin privilages"})
        }
        

        // Check is user is already a member 
        const existingMember = workspace.members.find((member)=> member.userId === userId);

        if(existingMember){
            return res.status(400).json({message: "usser is already a member"})
        }

        const member = await prisma.workspaceMember.create({
            data:{
                userId: user.id,
                workspaceId,
                role,
                message
            }
        })

        res.json({member, message: "member added succesfully"})
        

    } catch(error){
        console.log(error);
        res.status(500).json({message: error.code || error.message})
    }
}