import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Processing checkout request

    const priceId = body?.priceId;
    const userId = body?.userId;

    if (!priceId) {
      return Response.json({ error: 'Missing priceId' }, { status: 400 });
    }

    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: userId,
      },
      client_reference_id: userId, // CRITICAL: Link session to user
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
    });

    return Response.json({ url: session.url });

  } catch (err: any) {
    // Checkout error occurred

    return Response.json(
      { error: err.message || 'Stripe error' },
      { status: 500 }
    );
  }
}