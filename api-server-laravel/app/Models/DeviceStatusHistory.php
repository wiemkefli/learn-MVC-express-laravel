<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceStatusHistory extends Model
{
    use HasFactory;

    protected $table = 'device_status_history';

    protected $fillable = [
        'id',
        'device_id',
        'old_status',
        'new_status',
        'reason',
        'changed_at',
    ];

    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $casts = [
        'changed_at' => 'datetime',
    ];
}
