/** POST /api/vendors/samsara/sync — tenant-scoped Samsara vehicles, drivers, and HOS. */
import { mapSamsara } from "../../../_shared/vendor-mapper";
import { markVendorSync } from "../../../_shared/vendor-mapper";
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../../_shared/request-security";
import { mapSamsaraDailyLogs, mapSamsaraDrivers, nextCursor } from "../../../../src/lib/samsaraSync.mjs";

interface Env extends SecurityEnv { SAMSARA_API_TOKEN?: string; }
const json = (body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});

async function allPages(token:string,path:string):Promise<unknown[]> {
  const rows:unknown[]=[]; let after:string|null=null;
  for(let page=0;page<100;page++) {
    const join=path.includes("?")?"&":"?";
    const response=await fetch(`https://api.samsara.com${path}${after?`${join}after=${encodeURIComponent(after)}`:""}`,{headers:{Authorization:`Bearer ${token}`,Accept:"application/json"}});
    if(!response.ok) throw new Error(`Samsara ${response.status}: ${(await response.text()).slice(0,180)}`);
    const payload=await response.json() as {data?:unknown[];pagination?:{hasNextPage?:boolean;endCursor?:string}};
    if(Array.isArray(payload.data)) rows.push(...payload.data);
    after=nextCursor(payload); if(!after) break;
  }
  return rows;
}

async function upsert(env:Env,table:string,carrierId:string,rows:Record<string,unknown>[]):Promise<number> {
  if(!rows.length) return 0;
  const response=await fetch(`${env.SUPABASE_URL!.replace(/\/$/,"")}/rest/v1/${table}?on_conflict=carrier_id,source_vendor,source_id`,{method:"POST",headers:{apikey:env.SUPABASE_SERVICE_ROLE!,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE}`,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(rows.map(row=>({carrier_id:carrierId,...row})))});
  if(!response.ok) throw new Error(`${table} reconciliation ${response.status}: ${(await response.text()).slice(0,180)}`);
  return ((await response.json()) as unknown[]).length;
}

export const onRequestPost:PagesFunction<Env>=async(ctx)=>{
  let body:{carrier_id?:string}; try{body=await ctx.request.json();}catch{return json({ok:false,error:"Invalid JSON"},400);}
  const requestId=correlationId(ctx.request); let authority;
  try{authority=await requireTenant(ctx.request,ctx.env,body.carrier_id);}catch{return securityError(503,"authorization_unavailable",requestId);}
  if(!authority.ok)return securityError(authority.status,authority.code,requestId);
  if(!ctx.env.SAMSARA_API_TOKEN)return json({ok:false,configured:false,vendor:"samsara",error:"Samsara is not configured."},503);
  if(!ctx.env.SUPABASE_URL||!ctx.env.SUPABASE_SERVICE_ROLE)return securityError(503,"service_unavailable",requestId);
  const carrierId=authority.carrierId;
  try{
    const end=new Date().toISOString().slice(0,10); const startDate=new Date(`${end}T00:00:00Z`); startDate.setUTCDate(startDate.getUTCDate()-7); const start=startDate.toISOString().slice(0,10);
    const [vehicleRaw,driverRaw,hosRaw]=await Promise.all([
      allPages(ctx.env.SAMSARA_API_TOKEN,"/fleet/vehicles?limit=512"),
      allPages(ctx.env.SAMSARA_API_TOKEN,"/fleet/drivers?limit=512&driverActivationStatus=active"),
      allPages(ctx.env.SAMSARA_API_TOKEN,`/fleet/hos/daily-logs?startDate=${start}&endDate=${end}&limit=512`),
    ]);
    const vehicles=mapSamsara(vehicleRaw as Parameters<typeof mapSamsara>[0]).map(v=>({...v,source_vendor:"samsara",source_id:v.source_id}));
    const drivers=mapSamsaraDrivers(driverRaw) as Record<string,unknown>[];
    const vehicleCount=await upsert(ctx.env,"compass_vehicles",carrierId,vehicles as unknown as Record<string,unknown>[]);
    const driverCount=await upsert(ctx.env,"compass_drivers",carrierId,drivers);

    const linkResponse=await fetch(`${ctx.env.SUPABASE_URL.replace(/\/$/,"")}/rest/v1/compass_drivers?select=id,source_id&carrier_id=eq.${carrierId}&source_vendor=eq.samsara`,{headers:{apikey:ctx.env.SUPABASE_SERVICE_ROLE,Authorization:`Bearer ${ctx.env.SUPABASE_SERVICE_ROLE}`,Accept:"application/json"}});
    if(!linkResponse.ok)throw new Error(`driver link lookup ${linkResponse.status}`);
    const links=await linkResponse.json() as Array<{id:string;source_id:string}>; const bySource=new Map(links.map(link=>[link.source_id,link.id]));
    const hos=(mapSamsaraDailyLogs(hosRaw) as Array<Record<string,unknown>&{source_driver_id:string}>).flatMap(row=>{const driver_id=bySource.get(row.source_driver_id);return driver_id?[{...row,driver_id}]:[];});
    const hosCount=await upsert(ctx.env,"compass_hos_logs",carrierId,hos);
    const processed=vehicleCount+driverCount+hosCount;
    await markVendorSync(ctx.env,carrierId,"samsara",{success:true,count:processed});
    return json({ok:true,vendor:"samsara",window:{start,end},vehicles:{fetched:vehicleRaw.length,reconciled:vehicleCount},drivers:{fetched:driverRaw.length,reconciled:driverCount},hos:{fetched:hosRaw.length,reconciled:hosCount,unlinked:mapSamsaraDailyLogs(hosRaw).length-hos.length}});
  }catch(error){await markVendorSync(ctx.env,carrierId,"samsara",{success:false,count:0,error:error instanceof Error?error.message:"sync failed"});return securityError(502,"upstream_failed",requestId);}
};
