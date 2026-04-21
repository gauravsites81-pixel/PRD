import { NextResponse } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/supabase-server';

// Simple email service - in production, use Resend or SendGrid
async function sendEmail(to: string, subject: string, html: string) {
  // For now, we'll use a simple console.log approach
  // In production, integrate with your email service
  console.log(`📧 Email sent to ${to}: ${subject}`);
  
  // TODO: Replace with actual email service integration
  // const response = await fetch('https://api.resend.com/v1/email', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     from: 'noreply@golfheroes.com',
  //     to,
  //     subject,
  //     html,
  //   }),
  // });
  
  return true; // Placeholder
}

export async function POST(request: Request) {
  try {
    const { type, userId, data } = await request.json();

    if (!userId || !type) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient();

    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let subject = '';
    let html = '';

    switch (type) {
      case 'subscription_successful':
        subject = '🎉 Subscription Successful!';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px;">
              <h1 style="margin: 0 0 20px 0; font-size: 24px;">Welcome to GolfHeroes!</h1>
              <p style="margin: 0 0 10px 0; font-size: 16px;">Your subscription has been successfully activated.</p>
              <p style="margin: 0 0 10px 0; font-size: 14px;">You now have access to all features including:</p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>✅ Score management</li>
                <li>✅ Monthly draws</li>
                <li>✅ Prize winnings</li>
                <li>✅ Charity selection</li>
              </ul>
              <div style="margin-top: 20px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background: white; color: #10b981; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to Dashboard</a>
              </div>
            </div>
          </div>
        `;
        break;

      case 'draw_completed':
        subject = '🎯 Draw Results Are In!';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8fafc; color: #1f2937; padding: 20px; border-radius: 8px;">
              <h1 style="margin: 0 0 20px 0; font-size: 24px;">Draw Completed!</h1>
              <p style="margin: 0 0 10px 0; font-size: 16px;">The monthly draw has been completed and winners have been determined.</p>
              <div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">Draw Numbers:</h3>
                <p style="font-size: 18px; margin: 5px 0;">${data?.numbers?.join(', ') || 'No numbers'}</p>
                
                <h3 style="margin: 20px 0 10px 0; color: #1f2937;">Winners:</h3>
                ${data?.winners?.map((winner: any) => `
                  <div style="margin: 10px 0; padding: 10px; background: #f3f4f; border-left: 4px solid #10b981;">
                    <p style="margin: 0 0 5px 0; font-weight: bold;">${winner.name || 'Unknown'}</p>
                    <p>Matches: ${winner.matches || 0} | Prize: $${winner.prize?.toFixed(2) || '0'}</p>
                  </div>
                `).join('') || 'No winners'}
              </div>
              
              <div style="margin-top: 20px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Full Results</a>
              </div>
            </div>
          </div>
        `;
        break;

      case 'user_won':
        subject = '🏆 Congratulations! You Won!';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px;">
              <h1 style="margin: 0 0 20px 0; font-size: 28px;">🏆 Congratulations!</h1>
              <p style="margin: 0 0 10px 0; font-size: 18px;">You've won the ${data?.matchType || 'draw'}!</p>
              <div style="background: white; padding: 20px; border-radius: 4px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">Your Winnings:</h3>
                <p style="font-size: 16px; margin: 5px 0;">Matches: ${data?.matchType || 0}</p>
                <p style="font-size: 20px; margin: 5px 0; color: #10b981; font-weight: bold;">Prize: $${data?.prize?.toFixed(2) || '0'}</p>
                <p style="margin-top: 15px; font-size: 14px;">Please upload proof to claim your prize within 7 days.</p>
              </div>
              <div style="margin-top: 20px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background: white; color: #10b981; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Dashboard</a>
              </div>
            </div>
          </div>
        `;
        break;

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    await sendEmail((user as any).email, subject, html);

    return NextResponse.json({ 
      success: true,
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
