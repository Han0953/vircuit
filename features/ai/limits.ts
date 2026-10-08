import { RequestError } from "@/lib/request-security";
export type LimitPolicy = { minuteLimit: number; dayLimit: number; concurrency: number; timeoutMs: number };
type Usage = { times: number[]; requests: Map<string, { expires: number; active: boolean }> };
export class MemoryLimits {
  private users = new Map<string, Usage>();
  reserve(owner: string, id: string, policy: LimitPolicy, now = Date.now()) {
    for (const [key, value] of this.users) if (!value.times.some((time) => time > now - 86400000) && ![...value.requests.values()].some((r) => r.active && r.expires > now)) this.users.delete(key);
    if (!this.users.has(owner) && this.users.size >= 5000) throw new RequestError("Layanan Cirra sedang penuh. Coba lagi sebentar.", 503);
    const usage = this.users.get(owner) ?? { times: [], requests: new Map() };
    usage.times = usage.times.filter((time) => time > now - 86400000);
    for (const [key, value] of usage.requests) if (value.expires <= now) usage.requests.delete(key);
    if (usage.requests.has(id)) throw new RequestError("Permintaan ini sudah dikirim. Coba lagi dengan permintaan baru.", 409);
    if ([...usage.requests.values()].filter((r) => r.active).length >= policy.concurrency) throw new RequestError("Aku masih memproses permintaan lain. Tunggu atau batalkan dulu.", 429);
    if (usage.times.filter((t) => t > now - 60000).length >= policy.minuteLimit || usage.times.length >= policy.dayLimit) throw new RequestError("Batas penggunaan Cirra sedang tercapai. Coba lagi nanti.", 429);
    usage.times.push(now); usage.requests.set(id, { active: true, expires: now + policy.timeoutMs + 10000 }); this.users.set(owner, usage);
    return { finish: () => { const request = usage.requests.get(id); if (request) { request.active = false; request.expires = now + 60000; } } };
  }
}
export const developmentLimits = new MemoryLimits();
