<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $table = 'transactions';

    protected $primaryKey = 'transaction_id';

    protected $fillable = [
        'transaction_id',
        'device_id',
        'username',
        'event_type',
        'timestamp',
        'payload',
        'created_at',
    ];

    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $casts = [
        'payload' => 'array',
        'timestamp' => 'datetime',
        'created_at' => 'datetime',
    ];
}
