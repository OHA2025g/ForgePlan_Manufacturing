import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export async function owner(){const user=await getChatGPTUser();if(!user)throw new Error('AUTH_REQUIRED');return user.userId;}
export function db(){if(!env.DB)throw new Error('Workspace storage is temporarily unavailable.');return env.DB;}
export function bucket(){if(!env.BUCKET)throw new Error('Drawing storage is temporarily unavailable.');return env.BUCKET;}
export function checkOrigin(req:Request){const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)throw new Error('Request origin is not allowed.');}
export function apiError(error:unknown){const msg=error instanceof Error?error.message:'Unable to complete this request.';console.error('ForgePlan request:',msg);return Response.json({error:msg==='AUTH_REQUIRED'?'Sign in to access your private workspace.':msg},{status:msg==='AUTH_REQUIRED'?401:msg.includes('Invalid')||msg.includes('invalid')||msg.includes('must')||msg.includes('allowed')?400:503});}
