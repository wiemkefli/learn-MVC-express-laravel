<?php

namespace App\Services;

use App\Models\Transaction;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class TransactionService
{
    public function createTransaction(array $data): Transaction
    {
        return Transaction::create([
            'transaction_id' => (string) Str::uuid(),
            'device_id' => $data['device_id'],
            'username' => $data['username'] ?? null,
            'event_type' => $data['event_type'],
            'timestamp' => $data['timestamp'] ?? now(),
            'payload' => $data['payload'] ?? null,
            'created_at' => now(),
        ]);
    }

    public function listTransactions(array $filters = []): Collection
    {
        $query = Transaction::query();

        if (! empty($filters['device_id'])) {
            $query->where('device_id', $filters['device_id']);
        }

        if (! empty($filters['event_type'])) {
            $query->where('event_type', $filters['event_type']);
        }

        $limit = isset($filters['limit']) ? (int) $filters['limit'] : 100;

        return $query
            ->orderByDesc('timestamp')
            ->limit($limit)
            ->get();
    }
}
