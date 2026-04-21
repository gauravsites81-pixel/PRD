'use client';

import { FormEvent, useMemo, useState } from 'react';
import { getCharities, getUserCharity, updateUserCharity } from '@/lib/supabase';
import { validateCharityContribution } from '@/utils/validators';
import type { Charity, UserCharity } from '@/types/database';

type UserCharityWithCharity = UserCharity & {
  charities: Charity | null;
};

type CharitySelectorProps = {
  userId: string;
  initialCharities: Charity[];
  initialSelection: UserCharityWithCharity | null;
  disabled?: boolean;
};

export function CharitySelector({
  userId,
  initialCharities,
  initialSelection,
  disabled = false,
}: CharitySelectorProps) {
  const [charities, setCharities] = useState(initialCharities);
  const [selection, setSelection] = useState<UserCharityWithCharity | null>(initialSelection);
  const [selectedCharityId, setSelectedCharityId] = useState(initialSelection?.charity_id || '');
  const [percentage, setPercentage] = useState(
    initialSelection?.contribution_percentage?.toString() || '10'
  );
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedCharity = useMemo(
    () => charities.find((charity) => charity.id === selectedCharityId) || null,
    [charities, selectedCharityId]
  );

  async function refreshCharityData() {
    setIsRefreshing(true);
    const [latestCharities, latestSelection] = await Promise.all([
      getCharities(),
      getUserCharity(userId),
    ]);

    setCharities(latestCharities);
    setSelection(latestSelection as UserCharityWithCharity | null);

    if (latestSelection) {
      setSelectedCharityId((latestSelection as any).charity_id);
      setPercentage((latestSelection as any).contribution_percentage.toString());
    }

    setIsRefreshing(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!selectedCharityId) {
      setError('Select a charity before saving.');
      return;
    }

    const parsedPercentage = Number(percentage);

    if (!Number.isInteger(parsedPercentage)) {
      setError('Contribution percentage must be a whole number.');
      return;
    }

    const validation = validateCharityContribution(parsedPercentage);

    if (!validation.valid) {
      setError(validation.error || 'Contribution percentage is invalid.');
      return;
    }

    setIsSaving(true);

    const result = await updateUserCharity(userId, selectedCharityId, parsedPercentage);

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    await refreshCharityData();
    setMessage('Charity preference saved.');
    setIsSaving(false);
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-700">Charity contribution</p>
          <h2 className="mt-2 text-2xl font-extrabold">Choose your charity</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Select one charity and set the percentage of your membership contribution. Minimum contribution is 10%.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshCharityData}
          disabled={isRefreshing}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mt-6 rounded-lg bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-500">Current selection</p>
        {selection?.charities ? (
          <div className="mt-2">
            <p className="text-lg font-extrabold text-slate-950">{selection.charities.name}</p>
            <p className="mt-1 text-sm font-semibold text-emerald-700">
              {selection.contribution_percentage}% contribution
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm font-semibold text-slate-600">
            No charity selected yet.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {charities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <h3 className="font-extrabold">No charities available</h3>
            <p className="mt-2 text-sm text-slate-600">
              Add charities in Supabase before users can select one.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {charities.map((charity) => {
              const isSelected = charity.id === selectedCharityId;

              return (
                <button
                  key={charity.id}
                  type="button"
                  onClick={() => {
                    setSelectedCharityId(charity.id);
                    setError('');
                    setMessage('');
                  }}
                  className={`rounded-lg border p-4 text-left transition ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-base font-extrabold text-slate-950">
                    {charity.name}
                  </span>
                  {charity.description ? (
                    <span className="mt-2 block text-sm leading-6 text-slate-600">
                      {charity.description}
                    </span>
                  ) : (
                    <span className="mt-2 block text-sm text-slate-500">
                      No description provided.
                    </span>
                  )}
                  {isSelected ? (
                    <span className="mt-4 inline-flex rounded-md bg-emerald-500 px-2 py-1 text-xs font-extrabold text-slate-950">
                      Selected
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid gap-3 sm:max-w-xs">
          <label htmlFor="charityContribution" className="text-sm font-bold text-slate-700">
            Contribution percentage
          </label>
          <div className="flex items-center gap-2">
            <input
              id="charityContribution"
              type="number"
              min="10"
              max="100"
              step="1"
              value={percentage}
              onChange={(event) => setPercentage(event.target.value)}
              className="w-full rounded-md border-slate-300"
              required
            />
            <span className="font-extrabold text-slate-600">%</span>
          </div>
          <p className="text-xs font-semibold text-slate-500">Minimum 10%.</p>
        </div>

        {selectedCharity ? (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Saving will set <strong>{selectedCharity.name}</strong> as your chosen charity.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving || charities.length === 0}
          className="rounded-md bg-emerald-500 px-4 py-3 font-extrabold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save charity preference'}
        </button>
      </form>
    </section>
  );
}
