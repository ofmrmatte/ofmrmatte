export type ProjectId = 'dashboard' | 'admin' | 'automation' | 'scheduling';
export type DevelopmentPhase = 'IDLE' | 'CODING' | 'AUTOCOMPLETE' | 'COMPILING' | 'TESTING' | 'BUILD_COMPLETE' | 'PREVIEW_LOADING' | 'PREVIEW_REVEAL' | 'PREVIEW_INTERACTIVE' | 'TRANSITIONING';
export interface DemoFile { name: string; language: string; code: string }
export interface DemoProject { id: ProjectId; name: string; accent: string; host: string; files: DemoFile[] }
export const CYCLE_SECONDS = 64;
export const PROJECTS: DemoProject[] = [
  { id: 'dashboard', name: 'NORTH / Analytics', accent: '#78b7ff', host: 'analytics.demo.local/overview', files: [
    { name: 'RevenueChart.tsx', language: 'TypeScript React', code: `"use client";
import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip } from 'recharts';
type Revenue = { month: string; value: number };
export function RevenueChart({ data }: { data: Revenue[] }) {
  const [period, setPeriod] = useState('quarter');
  const total = useMemo(() =>
    data.reduce((sum, item) => sum + item.value, 0), [data]);
  return <section aria-label="Revenue overview">
    <header><h2>Revenue</h2><strong>{total}</strong></header>
    <select value={period} onChange={e => setPeriod(e.target.value)}>
      <option value="quarter">This quarter</option>
      <option value="year">This year</option>
    </select>
    <AreaChart width={720} height={320} data={data}>
      <XAxis dataKey="month" /><Tooltip />
      <Area dataKey="value" stroke="#78b7ff" fill="#163453" />
    </AreaChart>
  </section>;
}` },
    { name: 'metrics.service.ts', language: 'TypeScript / PostgreSQL', code: `import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
type Metric = { month: string; value: number };
export async function monthlyRevenue(tenantId: string): Promise<Metric[]> {
  const result = await pool.query<Metric>(
    \`SELECT to_char(created_at, 'Mon') AS month,
            sum(amount_cents) / 100.0 AS value
       FROM invoices
      WHERE tenant_id = $1 AND status = 'paid'
      GROUP BY date_trunc('month', created_at), month
      ORDER BY date_trunc('month', created_at)\`, [tenantId]);
  return result.rows;
}
export const reportOptions = {
  currency: 'USD',
  locale: 'en-US',
  comparison: 'previous-period',
} as const;` },
    { name: 'page.tsx', language: 'Next.js / Server Component', code: `import { RevenueChart } from './RevenueChart';
import { monthlyRevenue } from './metrics.service';
import { requireTenant } from '@/server/session';
export default async function OverviewPage() {
  const tenant = await requireTenant();
  const revenue = await monthlyRevenue(tenant.id);
  return <main className="workspace">
    <header><span>NORTH</span><h1>Overview</h1></header>
    <div className="metric-grid">
      <MetricCard title="Revenue" value="$128,420" />
      <MetricCard title="Customers" value="2,840" />
      <MetricCard title="Conversion" value="4.8%" />
    </div>
    <RevenueChart data={revenue} />
  </main>;
}
function MetricCard({ title, value }: { title: string; value: string }) {
  return <article><h2>{title}</h2><strong>{value}</strong></article>;
}` },
  ] },
  { id: 'admin', name: 'FORMA / Admin', accent: '#a99bff', host: 'admin.demo.local/users', files: [
    { name: 'users.route.ts', language: 'Node.js / REST API', code: `import { Router } from 'express';
import { z } from 'zod';
import { requireSession } from './auth';
import { users } from './users.repository';
export const router = Router();
const filters = z.object({
  status: z.enum(['active', 'invited']).optional(),
  page: z.coerce.number().int().positive().default(1),
});
router.get('/api/users', requireSession, async (req, res, next) => {
  try {
    const query = filters.parse(req.query);
    const result = await users.list(req.session.tenantId, query);
    res.json({ data: result.rows, total: result.total });
  } catch (error) { next(error); }
});` },
    { name: 'users.repository.ts', language: 'PostgreSQL / Parameterized query', code: `import { pool } from './database';
type Filter = { status?: 'active' | 'invited'; page: number };
export const users = {
  async list(tenantId: string, filter: Filter) {
    const offset = (filter.page - 1) * 20;
    const result = await pool.query(
      \`SELECT id, display_name, role, status, count(*) OVER() AS total
         FROM users WHERE tenant_id = $1
          AND ($2::text IS NULL OR status = $2)
        ORDER BY display_name LIMIT 20 OFFSET $3\`,
      [tenantId, filter.status ?? null, offset]);
    return { rows: result.rows, total: Number(result.rows[0]?.total ?? 0) };
  },
};` },
    { name: 'UsersTable.tsx', language: 'React / Accessible table', code: `import { useState } from 'react';
type User = { id: string; name: string; role: string; status: string };
export function UsersTable({ rows }: { rows: User[] }) {
  const [status, setStatus] = useState('all');
  const visible = rows.filter(row => status === 'all' || row.status === status);
  return <section>
    <h1>People & access</h1>
    <select aria-label="Status" value={status}
      onChange={event => setStatus(event.target.value)}>
      <option value="all">All people</option>
      <option value="active">Active</option>
    </select>
    <table><tbody>{visible.map(user =>
      <tr key={user.id}><td>{user.name}</td><td>{user.role}</td>
        <td>{user.status}</td></tr>
    )}</tbody></table>
  </section>;
}` },
  ] },
  { id: 'automation', name: 'RELAY / Workflows', accent: '#68dcb3', host: 'relay.demo.local/workflows/orders', files: [
    { name: 'webhook.ts', language: 'Node.js / Webhook', code: `import { createHmac, timingSafeEqual } from 'node:crypto';
import { queue } from './queue';
export async function receiveWebhook(raw: Buffer, signature: string) {
  const expected = createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(raw).digest();
  const supplied = Buffer.from(signature, 'hex');
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw new Error('Invalid signature');
  }
  const event = JSON.parse(raw.toString('utf8'));
  await queue.add('sync-order', event, { jobId: event.id });
  return { accepted: true };
}` },
    { name: 'sync.worker.ts', language: 'TypeScript / Queue worker', code: `import { Worker } from 'bullmq';
import { connection } from './queue';
import { db, crm, notifications } from './integrations';
export const worker = new Worker('orders', async job => {
  await job.updateProgress(10);
  const order = await db.orders.upsert(job.data);
  await job.updateProgress(45);
  const contact = await crm.syncContact(order.customer);
  await job.updateProgress(80);
  await notifications.send({ contactId: contact.id, orderId: order.id });
  await job.updateProgress(100);
  return { orderId: order.id, synchronized: true };
}, { connection, concurrency: 4 });
process.on('SIGTERM', async () => { await worker.close(); });` },
    { name: 'WorkflowCanvas.tsx', language: 'React / Workflow graph', code: `import { ReactFlow, Background } from '@xyflow/react';
const steps = ['Webhook', 'Validate', 'CRM sync', 'Database', 'Notify'];
export function WorkflowCanvas() {
  const nodes = steps.map((label, index) => ({
    id: String(index), position: { x: index * 180, y: 120 },
    data: { label }, type: index === 0 ? 'input' : 'default',
  }));
  const edges = steps.slice(1).map((_, index) => ({
    id: 'edge-' + index, source: String(index), target: String(index + 1),
    animated: true,
  }));
  return <ReactFlow nodes={nodes} edges={edges} fitView>
    <Background gap={20} />
  </ReactFlow>;
}` },
  ] },
  { id: 'scheduling', name: 'MOMENT / Bookings', accent: '#f1be87', host: 'moment.demo.local/calendar', files: [
    { name: 'availability.ts', language: 'TypeScript / Scheduling', code: `type Booking = { startsAt: Date; duration: number };
export function availableSlots(day: Date, bookings: Booking[]) {
  return Array.from({ length: 16 }, (_, index) => {
    const startsAt = new Date(day);
    startsAt.setHours(9 + Math.floor(index / 2), (index % 2) * 30, 0, 0);
    const free = bookings.every(booking => {
      const end = booking.startsAt.getTime() + booking.duration * 60000;
      return startsAt.getTime() >= end ||
        startsAt.getTime() + 1800000 <= booking.startsAt.getTime();
    });
    return { startsAt, free };
  });
}` },
    { name: 'booking.route.ts', language: 'Next.js / Route handler', code: `import { NextResponse } from 'next/server';
import { db } from '@/server/database';
import { bookingSchema } from './schema';
export async function POST(request: Request) {
  const input = bookingSchema.parse(await request.json());
  const booking = await db.transaction(async tx => {
    await tx.lockSlot(input.slotId);
    const slot = await tx.slots.findAvailable(input.slotId);
    if (!slot) throw new Error('Slot no longer available');
    return tx.bookings.create(input);
  });
  return NextResponse.json({ booking }, { status: 201 });
}` },
    { name: 'Calendar.tsx', language: 'React / Booking interface', code: `import { useState } from 'react';
type Slot = { id: string; label: string; free: boolean };
export function Calendar({ slots }: { slots: Slot[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  return <section aria-label="Appointment calendar">
    <h1>Make time for what matters.</h1>
    <div className="slot-grid">{slots.map(slot =>
      <button key={slot.id} disabled={!slot.free}
        aria-pressed={selected === slot.id}
        onClick={() => setSelected(slot.id)}>{slot.label}</button>
    )}</div>
    <button disabled={!selected} onClick={() => setConfirmed(true)}>
      Confirm appointment
    </button>
    {confirmed && <p role="status">Your appointment is confirmed.</p>}
  </section>;
}` },
  ] },
];

export interface ScreenAnimationState {
  elapsed: number; localTime: number; cycle: number; projectIndex: number;
  project: DemoProject; phase: DevelopmentPhase; codeProgress: number;
  buildProgress: number; previewProgress: number; interactiveTime: number;
  transition: number; scrollProgress: number; reducedMotion: boolean;
}
const clamp = (n: number) => Math.max(0, Math.min(1, n));
export function sampleDevelopmentTime(elapsed: number, scrollProgress = 0, reducedMotion = false, out?: ScreenAnimationState): ScreenAnimationState {
  const safe = Math.max(0, Number.isFinite(elapsed) ? elapsed : 0);
  const cycle = Math.floor(safe / CYCLE_SECONDS), projectIndex = cycle % PROJECTS.length;
  const t = reducedMotion ? 45 : safe % CYCLE_SECONDS;
  const phase: DevelopmentPhase = t < 1 ? 'IDLE' : t < 8 ? 'CODING' : t < 9.5 ? 'AUTOCOMPLETE' : t < 18 ? 'CODING' : t < 22 ? 'COMPILING' : t < 25 ? 'TESTING' : t < 27 ? 'BUILD_COMPLETE' : t < 29 ? 'PREVIEW_LOADING' : t < 34 ? 'PREVIEW_REVEAL' : t < 60 ? 'PREVIEW_INTERACTIVE' : 'TRANSITIONING';
  const result = out ?? {} as ScreenAnimationState;
  result.elapsed = safe; result.localTime = t; result.cycle = cycle; result.projectIndex = projectIndex;
  result.project = PROJECTS[projectIndex]; result.phase = phase;
  result.codeProgress = clamp((Math.min(t, 8) - 1 + Math.max(0, t - 9.5)) / 15.5);
  result.buildProgress = clamp((t - 18) / 7); result.previewProgress = clamp((t - 29) / 5);
  result.interactiveTime = Math.max(0, t - 34); result.transition = clamp((t - 60) / 4);
  result.scrollProgress = clamp(scrollProgress); result.reducedMotion = reducedMotion;
  return result;
}
