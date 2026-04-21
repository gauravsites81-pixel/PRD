import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

export async function POST() {
  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'gauravsites81@gmail.com',
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ data });
}
