<?php

namespace App\Services;

use App\Models\Device;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DeviceService
{
    public function __construct(private readonly ProcessManager $processManager)
    {
    }

    public function createDevice(array $data): Device
    {
        $deviceType = $data['device_type'] ?? null;
        $allowedTypes = [
            Device::TYPE_ACCESS_CONTROLLER,
            Device::TYPE_FACE_READER,
            Device::TYPE_ANPR,
        ];

        if (! in_array($deviceType, $allowedTypes, true)) {
            throw new HttpException(400, 'Invalid device_type');
        }

        return Device::create([
            'id' => (string) Str::uuid(),
            'name' => $data['name'],
            'device_type' => $deviceType,
            'ip_address' => $data['ip_address'],
            'status' => Device::STATUS_INACTIVE,
            'metadata' => $data['metadata'] ?? null,
        ]);
    }

    public function listDevices(): array
    {
        $liveActiveIds = $this->processManager->liveActiveDeviceIds();

        return Device::orderByDesc('created_at')
            ->get()
            ->map(fn (Device $device) => [
                ...$device->toArray(),
                'live_active' => in_array($device->id, $liveActiveIds, true),
            ])
            ->all();
    }

    public function activateDevice(string $deviceId): array
    {
        return $this->processManager->startProcess($deviceId);
    }

    public function deactivateDevice(string $deviceId): array
    {
        return $this->processManager->stopProcess($deviceId);
    }
}
