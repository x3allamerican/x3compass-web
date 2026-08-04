import { expect, test } from "@playwright/test";
import { onRequestPost } from "../functions/api/vendors/samsara/sync";

const CARRIER="00000000-0000-4000-8000-000000000001", USER="00000000-0000-4000-8000-000000000002";
const env={SUPABASE_URL:"https://db.example.test",SUPABASE_SERVICE_ROLE:"role",SAMSARA_API_TOKEN:"mock-token"};

test.describe("Samsara sync API",()=>{
  test.describe.configure({mode:"serial"}); const original=globalThis.fetch;
  test.afterEach(()=>{globalThis.fetch=original;});
  test("reconciles mocked drivers, vehicles, and HOS idempotently",async()=>{
    const calls:string[]=[];
    globalThis.fetch=(async(input:RequestInfo|URL,init?:RequestInit)=>{const url=String(input);calls.push(`${init?.method||"GET"} ${url}`);
      if(url.includes("/auth/v1/user"))return Response.json({id:USER});
      if(url.includes("compass_carrier_users"))return Response.json([{carrier_id:CARRIER}]);
      if(url.includes("api.samsara.com/fleet/vehicles"))return Response.json({data:[{id:"v1",vin:"1M8GDM9AXKP042788",licensePlate:"ABC123"}],pagination:{hasNextPage:false}});
      if(url.includes("api.samsara.com/fleet/drivers"))return Response.json({data:[{id:"s1",name:"Ada Lovelace",driverActivationStatus:"active"}],pagination:{hasNextPage:false}});
      if(url.includes("api.samsara.com/fleet/hos/daily-logs"))return Response.json({data:[{driver:{id:"s1"},startTime:"2026-08-03T00:00:00Z",dutyStatusDurations:{driveDurationMs:3600000}}],pagination:{hasNextPage:false}});
      if(url.includes("compass_drivers?select=id,source_id"))return Response.json([{id:"local-d1",source_id:"s1"}]);
      if(url.includes("compass_vehicles?on_conflict"))return Response.json([{id:"local-v1"}]);
      if(url.includes("compass_drivers?on_conflict"))return Response.json([{id:"local-d1"}]);
      if(url.includes("compass_hos_logs?on_conflict"))return Response.json([{id:"local-h1"}]);
      if(url.includes("compass_vendor_integrations"))return Response.json([]);
      throw new Error(`unexpected ${url}`);
    }) as typeof fetch;
    const request=new Request("https://x3compass.com/api/vendors/samsara/sync",{method:"POST",headers:{Authorization:"Bearer user-token","Content-Type":"application/json"},body:JSON.stringify({carrier_id:CARRIER})});
    const response=await onRequestPost({request,env} as never); const body=await response.json();
    expect(response.status).toBe(200); expect(body.ok).toBe(true); expect(body.drivers.reconciled).toBe(1); expect(body.vehicles.reconciled).toBe(1); expect(body.hos.reconciled).toBe(1);
    expect(calls.filter(call=>call.includes("on_conflict=carrier_id,source_vendor,source_id"))).toHaveLength(3);
    expect(calls.every(call=>!call.includes("mock-token"))).toBe(true);
  });
});
