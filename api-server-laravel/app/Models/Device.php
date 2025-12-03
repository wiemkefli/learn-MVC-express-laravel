<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    use HasFactory;

    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_ACTIVE = 'active';

    public const TYPE_ACCESS_CONTROLLER = 'access_controller';
    public const TYPE_FACE_READER = 'face_reader';
    public const TYPE_ANPR = 'anpr';

    protected $table = 'devices';

    protected $fillable = [
        'id',
        'name',
        'device_type',
        'ip_address',
        'status',
        'metadata',
    ];

    public $incrementing = false;

    protected $keyType = 'string';

    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
