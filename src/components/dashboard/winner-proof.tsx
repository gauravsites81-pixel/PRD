'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import type { DrawResult } from '@/types/database';

type Props = {
  userId: string;
  disabled?: boolean;
};

export function WinnerProof({ userId, disabled = false }: Props) {
  const supabase = createBrowserSupabaseClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [winning, setWinning] = useState<DrawResult | null>(null);

  useEffect(() => {
    async function fetchWinningData() {
      const { data } = await supabase
        .from('draw_results')
        .select('*')
        .eq('winner_user_id', userId)
        .eq('payment_status', 'pending')
        .maybeSingle();
      
      setWinning(data as DrawResult | null);
    }

    fetchWinningData();
  }, [userId]);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setMessage('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!selectedFile.type.startsWith('image/')) {
      setMessage('Please upload an image file');
      return;
    }

    setFile(selectedFile);
    setMessage('');
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    
    if (!file || !winning) return;

    setUploading(true);
    setMessage('');

    try {
      // Upload file to Supabase Storage
      const fileName = `winner-proof/${userId}/${winning.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('winner-proofs')
        .upload(fileName, file);

      if (uploadError) {
        setMessage('Failed to upload file');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('winner-proofs')
        .getPublicUrl(fileName);

      // Update draw_results with proof URL
      const { error: updateError } = await supabase
        .from('draw_results')
        .update({
          proof_url: publicUrl,
          verification_status: 'pending'
        })
        .eq('id', winning.id)
        .eq('winner_user_id', userId);

      if (updateError) {
        setMessage('Failed to update proof');
        return;
      }

      setMessage('Proof uploaded successfully! Awaiting admin verification.');
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('proof-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error('Upload error:', err);
      setMessage('Something went wrong');
    } finally {
      setUploading(false);
    }
  }

  if (!winning) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Winner Verification</h3>
        <p className="text-gray-500">No winning to verify</p>
      </div>
    );
  }

  if (winning.verification_status === 'approved') {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Winner Verification</h3>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">✅ Proof Approved</p>
          <p className="text-green-700 mt-2">Your proof has been verified and approved.</p>
          {winning.payment_status === 'paid' && (
            <p className="text-green-600 font-bold mt-2">Payment Status: Paid</p>
          )}
        </div>
      </div>
    );
  }

  if (winning.verification_status === 'rejected') {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Winner Verification</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">❌ Proof Rejected</p>
          <p className="text-red-700 mt-2">Your proof was rejected. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Winner Verification</h3>
      
      <div className="mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">Congratulations! You won!</p>
          <p className="text-yellow-700 mt-2">
            {winning.match_type} matches - Prize: ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(winning.prize_amount)}
          </p>
          <p className="text-yellow-600 mt-2 text-sm">
            Please upload proof to claim your prize
          </p>
        </div>
      </div>

      {winning.proof_url && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-2">Current Proof:</h4>
          <div className="border rounded-lg p-4">
            <img 
              src={winning.proof_url} 
              alt="Winner proof" 
              className="max-w-md h-auto rounded"
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Proof (Image - Max 5MB)
          </label>
          <input
            id="proof-file"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={disabled || uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-50 file:text-gray-700 file:py-2 file:px-4 file:border-gray-300 file:hover:bg-gray-100 disabled:opacity-50"
          />
        </div>

        {file && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}

        {message && (
          <div className={`mt-2 p-3 rounded-lg text-sm ${
            message.includes('success') 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={disabled || uploading || !file}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload Proof'}
        </button>
      </form>

      {winning.verification_status === 'pending' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Your proof is being reviewed by administrators. You&apos;ll be notified once verified.
          </p>
        </div>
      )}
    </div>
  );
}
