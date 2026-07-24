// supabase/functions/send-push/index.ts
// Recebe o payload do Database Webhook (tabela salon_bookings, INSERT/UPDATE)
// e envia push via FCM HTTP v1 para os tokens relevantes (admin + cliente do agendamento).
//
// IMPORTANTE: adaptado ao schema real deste projeto —
//  - o agendamento identifica o cliente por `client_name` (texto), não por id;
//  - os status reais são: pending | scheduled | completed | cancelled.

import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5.2.0";

const PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID")!;
const CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
const PRIVATE_KEY = Deno.env.get("FIREBASE_PRIVATE_KEY")!.replace(/\\n/g, "\n");

async function getAccessToken(): Promise<string> {
  const key = await importPKCS8(PRIVATE_KEY, "RS256");
  const jwt = await new SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setIssuer(CLIENT_EMAIL)
    .setAudience("https://oauth2.googleapis.com/token")
    .setExpirationTime("1h")
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  return data.access_token;
}

async function sendToToken(accessToken: string, token: string, title: string, body: string) {
  await fetch(
    `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          android: { priority: "high" },
        },
      }),
    }
  );
}

Deno.serve(async (req) => {
  const payload = await req.json();
  const novo = payload.record;
  const antigo = payload.old_record;
  if (!novo) return new Response("sem record, ignorado", { status: 200 });

  // Só notifica quando o status muda (ou num INSERT novo, sem registro antigo)
  const mudouStatus = !antigo || novo.status !== antigo.status;
  if (!mudouStatus) return new Response("sem mudança de status, ignorado", { status: 200 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const H = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  // Resolve o id do cliente pelo nome (o agendamento guarda client_name)
  let clienteId: string | null = null;
  if (novo.client_name) {
    const r = await fetch(
      `${supabaseUrl}/rest/v1/salon_clients?full_name=eq.${encodeURIComponent(novo.client_name)}&select=id`,
      { headers: H }
    );
    const arr = await r.json();
    clienteId = Array.isArray(arr) && arr[0]?.id ? arr[0].id : null;
  }

  // Tokens: admin sempre recebe + o cliente dono do agendamento (se encontrado)
  let orFilter = "role.eq.admin";
  if (clienteId) orFilter += `,and(role.eq.cliente,owner_id.eq.${clienteId})`;
  const resTokens = await fetch(
    `${supabaseUrl}/rest/v1/push_tokens?or=(${orFilter})&select=token,role`,
    { headers: H }
  );
  const tokens: { token: string; role: string }[] = await resTokens.json();

  const statusTexto: Record<string, string> = {
    pending: "Novo agendamento recebido",
    scheduled: "Seu horário foi aprovado ✅",
    completed: "Atendimento finalizado 💅",
    cancelled: "Seu agendamento foi cancelado",
  };
  const titulo = "Morgane Faoli Nail Style";
  const corpo = statusTexto[novo.status] ?? `Status atualizado: ${novo.status}`;

  const accessToken = await getAccessToken();
  await Promise.all(
    (tokens || []).map((t) => sendToToken(accessToken, t.token, titulo, corpo))
  );

  return new Response(JSON.stringify({ enviados: (tokens || []).length }), {
    status: 200,
  });
});
