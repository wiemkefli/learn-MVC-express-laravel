<?php

namespace App\Services;

use App\Models\Device;
use App\Models\DeviceProcess;
use App\Models\DeviceStatusHistory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Process\Process;

class ProcessManager
{
    private const HEARTBEAT_WINDOW_SECONDS = 10;

    public function liveActiveDeviceIds(): array
    {
        return $this->activeProcessQuery()
            ->pluck('device_id')
            ->unique()
            ->values()
            ->all();
    }

    public function startProcess(string $deviceId): array
    {
        $result = DB::transaction(function () use ($deviceId) {
            $device = Device::lockForUpdate()->find($deviceId);

            if (! $device) {
                throw new HttpException(404, 'Device not found');
            }

            $activeProcess = $this->activeProcessQuery()
                ->where('device_id', $deviceId)
                ->first();

            if ($activeProcess) {
                return [
                    'device' => $device->toArray(),
                    'process' => $activeProcess->toArray(),
                    'alreadyRunning' => true,
                ];
            }

            $process = DeviceProcess::create([
                'id' => (string) Str::uuid(),
                'device_id' => $deviceId,
                'pid' => 'pending',
                'started_at' => now(),
                'last_heartbeat_at' => now(),
            ]);

            if ($device->status !== Device::STATUS_ACTIVE) {
                DeviceStatusHistory::create([
                    'id' => (string) Str::uuid(),
                    'device_id' => $deviceId,
                    'old_status' => $device->status,
                    'new_status' => Device::STATUS_ACTIVE,
                    'reason' => 'user_clicked_activate',
                    'changed_at' => now(),
                ]);

                $device->status = Device::STATUS_ACTIVE;
                $device->save();
            }

            return [
                'device' => $device->fresh()->toArray(),
                'process' => $process->toArray(),
                'process_id' => $process->id,
                'alreadyRunning' => false,
            ];
        });

        $processId = $result['process_id'] ?? null;

        if (! ($result['alreadyRunning'] ?? false) && $processId) {
            $this->launchWorker($deviceId, $processId);
            $result['process'] = DeviceProcess::find($processId)?->toArray();
        }

        unset($result['process_id']);

        return $result;
    }

    public function stopProcess(string $deviceId): array
    {
        $activeProcesses = $this->activeProcessQuery()
            ->where('device_id', $deviceId)
            ->get();

        if ($activeProcesses->isEmpty()) {
            $this->markDeviceInactive($deviceId, 'user_clicked_deactivate_no_worker');
            return ['stopped' => false, 'reason' => 'not_running'];
        }

        $this->markDeviceInactive($deviceId, 'user_clicked_deactivate');

        return ['stopped' => true];
    }

    public function handleWorkerExit(string $deviceId, ?string $processId = null): void
    {
        DB::transaction(function () use ($deviceId, $processId) {
            $now = now();

            if ($processId) {
                DeviceProcess::where('id', $processId)
                    ->whereNull('stopped_at')
                    ->update(['stopped_at' => $now]);
            }

            $open = $this->activeProcessQuery()
                ->where('device_id', $deviceId)
                ->exists();

            if (! $open) {
                $this->markDeviceInactive($deviceId, 'worker_exit', updateProcesses: false);
            }
        });
    }

    private function markDeviceInactive(string $deviceId, string $reason, bool $updateProcesses = true): ?Device
    {
        return DB::transaction(function () use ($deviceId, $reason, $updateProcesses) {
            $now = now();

            if ($updateProcesses) {
                DeviceProcess::where('device_id', $deviceId)
                    ->whereNull('stopped_at')
                    ->update(['stopped_at' => $now]);
            }

            $device = Device::lockForUpdate()->find($deviceId);

            if (! $device) {
                return null;
            }

            if ($device->status !== Device::STATUS_INACTIVE) {
                DeviceStatusHistory::create([
                    'id' => (string) Str::uuid(),
                    'device_id' => $deviceId,
                    'old_status' => $device->status,
                    'new_status' => Device::STATUS_INACTIVE,
                    'reason' => $reason,
                    'changed_at' => $now,
                ]);

                $device->status = Device::STATUS_INACTIVE;
                $device->save();
            }

            return $device;
        });
    }

    private function launchWorker(string $deviceId, string $processId): void
    {
        try {
            $command = [
                PHP_BINARY,
                base_path('artisan'),
                'mdms:device-worker',
                $deviceId,
                $processId,
            ];

            $process = new Process($command, base_path());
            $process->disableOutput();
            $process->setTimeout(null);
            $process->start();

            $pid = $process->getPid() ?: 'worker-'.Str::random(8);

            DeviceProcess::where('id', $processId)->update(['pid' => (string) $pid]);

            Log::info('Started device worker', [
                'device_id' => $deviceId,
                'process_id' => $processId,
                'pid' => $pid,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to start worker', [
                'device_id' => $deviceId,
                'process_id' => $processId,
                'error' => $e->getMessage(),
            ]);

            $this->markDeviceInactive($deviceId, 'worker_launch_failed');
        }
    }

    private function activeProcessQuery(): Builder
    {
        $threshold = now()->subSeconds(self::HEARTBEAT_WINDOW_SECONDS);

        return DeviceProcess::query()
            ->whereNull('stopped_at')
            ->where('last_heartbeat_at', '>=', $threshold);
    }
}
