/* ============================================================
   X3 Compass Hazmat — Supabase client + helpers
   Phase 3.0 demo wiring: anon access scoped to QA Smoke Carrier
   Production hardening (Phase 3.1) replaces DEMO_CARRIER_ID
   with the authenticated user's actual carrier from JWT.
   ============================================================ */
(function(){
  const SUPABASE_URL = 'https://lsxtcluavinibdqlooil.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzeHRjbHVhdmluaWJkcWxvb2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDkyMjUsImV4cCI6MjA5MjI4NTIyNX0.13VNqHHOjzvOXwknnW2ZDjwYUh7ik6SPm2MlGwPpZ4c';
  const DEMO_CARRIER_ID = '5eab106b-e0c6-46bc-92a8-cb183cf2afd7';

  // Lightweight Supabase REST wrapper — uses logged-in token when present, else anon
  async function sb(method, path, body){
    const token = (window.HZAuth && window.HZAuth.token) || SUPABASE_ANON_KEY;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : (method === 'PATCH' ? 'return=representation' : '')
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`Supabase ${method} ${path} failed: ${r.status} ${text}`);
    }
    if (r.status === 204) return null;
    return r.json();
  }

  window.HZ = {
    DEMO_CARRIER_ID,
    SUPABASE_URL,

    // ===== SUBSCRIPTIONS =====
    async getSubscription(){
      const rows = await sb('GET', `compass_hazmat_subscriptions?carrier_id=eq.${DEMO_CARRIER_ID}&select=*`);
      return rows[0] || null;
    },
    async activateTrial(){
      const trial_started = new Date();
      const trial_ends = new Date(Date.now() + 14*24*60*60*1000);
      // Upsert via PATCH on the existing row
      const rows = await sb('PATCH', `compass_hazmat_subscriptions?carrier_id=eq.${DEMO_CARRIER_ID}`, {
        status: 'trial',
        trial_started_at: trial_started.toISOString(),
        trial_ends_at: trial_ends.toISOString()
      });
      return rows[0];
    },

    // ===== AUDIT CHECKLIST =====
    async loadAuditState(){
      const rows = await sb('GET', `compass_hazmat_audit_responses?carrier_id=eq.${DEMO_CARRIER_ID}&select=audit_item_id,completed,completed_at,notes`);
      const map = {};
      for (const r of rows) map[r.audit_item_id] = r;
      return map;
    },
    async toggleAuditItem(audit_item_id, completed, category, cfr_cite){
      // Upsert via PostgREST on_conflict
      const body = {
        carrier_id: DEMO_CARRIER_ID,
        audit_item_id,
        category: category || 'general',
        cfr_cite: cfr_cite || null,
        completed: !!completed,
        completed_at: completed ? new Date().toISOString() : null
      };
      const rows = await sb('POST', `compass_hazmat_audit_responses?on_conflict=carrier_id,audit_item_id`, body);
      return rows[0];
    },

    // ===== SUBSTANCE FAVORITES =====
    async listFavorites(){
      return sb('GET', `compass_hazmat_substance_favorites?carrier_id=eq.${DEMO_CARRIER_ID}&select=*&order=created_at.desc`);
    },
    async addFavorite(un_number, shipping_name, hazard_class){
      const body = {
        carrier_id: DEMO_CARRIER_ID,
        un_number,
        shipping_name: shipping_name || null,
        hazard_class: hazard_class || null
      };
      try {
        const rows = await sb('POST', 'compass_hazmat_substance_favorites?on_conflict=carrier_id,un_number', body);
        return rows[0];
      } catch(e) {
        // Already exists — that's fine
        return null;
      }
    },
    async removeFavorite(un_number){
      return sb('DELETE', `compass_hazmat_substance_favorites?carrier_id=eq.${DEMO_CARRIER_ID}&un_number=eq.${un_number}`);
    },

    // ===== SHIPMENTS (BOL save) =====
    async saveShipment(payload){
      const body = Object.assign({ carrier_id: DEMO_CARRIER_ID }, payload);
      const rows = await sb('POST', 'compass_hazmat_shipments?on_conflict=carrier_id,bol_number', body);
      return rows[0];
    },
    async listShipments(limit){
      limit = limit || 10;
      return sb('GET', `compass_hazmat_shipments?carrier_id=eq.${DEMO_CARRIER_ID}&select=id,bol_number,shipper_name,consignee_name,un_number,proper_shipping_name,hazard_class,created_at&order=created_at.desc&limit=${limit}`);
    },

    // ===== LITHIUM DECISIONS =====
    async saveLithiumDecision(payload){
      const body = Object.assign({ carrier_id: DEMO_CARRIER_ID }, payload);
      const rows = await sb('POST', 'compass_hazmat_lithium_decisions', body);
      return rows[0];
    },

    // ===== EXEMPTION DECISIONS =====
    async saveExemption(payload){
      const body = Object.assign({ carrier_id: DEMO_CARRIER_ID },
    // ===== TRAINING RECORDS =====
    async listTraining(){
      return sb('GET', `compass_hazmat_training_records?carrier_id=eq.${DEMO_CARRIER_ID}&select=*&order=completed_date.desc&limit=200`);
    },
    async addTraining(payload){
      const body = Object.assign({ carrier_id: DEMO_CARRIER_ID }, payload);
      const rows = await sb('POST', 'compass_hazmat_training_records', body);
      return rows[0];
    },

    // ===== SECURITY PLAN =====
    async getSecurityPlan(){
      const rows = await sb('GET', `compass_hazmat_security_plans?carrier_id=eq.${DEMO_CARRIER_ID}&select=*`);
      return rows[0] || null;
    },
    async saveSecurityPlan(payload){
      const body = Object.assign({ carrier_id: DEMO_CARRIER_ID }, payload);
      const rows = await sb('POST', 'compass_hazmat_security_plans?on_conflict=carrier_id', body);
      return rows[0];
    }
, payload);
      const rows = await sb('POST', 'compass_hazmat_exemption_decisions', body);
      return rows[0];
    }
  };
})();
