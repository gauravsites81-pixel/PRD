
'use client';

export function SubscribeButtons({
  monthlyPriceId,
  yearlyPriceId,
  userId,
  userEmail,
}: {
  monthlyPriceId: string;
  yearlyPriceId: string;
  userId: string;
  userEmail: string;
}) {
  async function handleSubscribe(priceId: string) {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, userId, userEmail }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error);
    }
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={() => handleSubscribe(monthlyPriceId)}
        className="bg-emerald-500 px-4 py-2 rounded"
      >
        Monthly Plan
      </button>

      <button
        onClick={() => handleSubscribe(yearlyPriceId)}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Yearly Plan
      </button>
    </div>
  );
}