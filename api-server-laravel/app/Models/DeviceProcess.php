<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceProcess extends Model
{
    use HasFactory;

    protected $table = 'device_processes';

    protected $fillable = [
        'id',
        'device_id',
        'pid',
        'started_at',
        'last_heartbeat_at',
        'stopped_at',
    ];

    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $casts = [
        'started_at' => 'datetime',
        'last_heartbeat_at' => 'datetime',
        'stopped_at' => 'datetime',
    ];
}
