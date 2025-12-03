<?php

namespace App\Console\Commands;

use App\Models\Device;
use App\Models\DeviceProcess;
use App\Services\ProcessManager;
use App\Services\TransactionService;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class DeviceWorker extends Command
{
    protected $signature = 'mdms:device-worker {deviceId} {processId}';

    protected $description = 'Simulate device worker events and persist them';

    private const USERS = ['alice', 'bob', 'charlie', 'system'];

    private const EVENTS = [
        'access_controller' => ['access_granted', 'access_denied'],
        'face_reader' => ['face_match', 'face_no_match'],
        'anpr' => ['plate_read', 'plate_mismatch'],
    ];

    public function __construct(
        private readonly TransactionService $transactionService,
        private readonly ProcessManager $processManager,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $deviceId = (string) $this->argument('deviceId');
        $processId = (string) $this->argument('processId');

        $device = Device::find($deviceId);

        if (! $device) {
            $this->error('Device not found for worker');
            return self::FAILURE;
        }

        $process = DeviceProcess::find($processId);

        if (! $process) {
            $this->error('Process not found for worker');
            return self::FAILURE;
        }

        while (true) {
            $process->refresh();

            if ($process->stopped_at) {
                break;
            }

            $this->sleepRandom();

            $eventType = $this->randomEvent($device->device_type);
            $payload = $this->buildPayload($device->device_type);
            $username = Arr::random(self::USERS);

            try {
                $this->transactionService->createTransaction([
                    'device_id' => $deviceId,
                    'username' => $username,
                    'event_type' => $eventType,
                    'payload' => $payload,
                    'timestamp' => now(),
                ]);

                $process->last_heartbeat_at = now();
                $process->save();
            } catch (\Throwable $e) {
                Log::error('Persist tx error', ['error' => $e->getMessage()]);
            }
        }

        $this->processManager->handleWorkerExit($deviceId, $processId);

        return self::SUCCESS;
    }

    private function randomEvent(string $deviceType): string
    {
        $events = self::EVENTS[$deviceType] ?? ['event'];

        return Arr::random($events);
    }

    private function sleepRandom(): void
    {
        $milliseconds = random_int(1000, 4000);
        usleep($milliseconds * 1000);
    }

    private function buildPayload(string $kind): array
    {
        return match ($kind) {
            'access_controller' => [
                'door_id' => 'A1',
                'method' => Arr::random(['card', 'pin', 'mobile']),
                'ok' => random_int(0, 100) > 20,
            ],
            'face_reader' => [
                'face_id' => 'F-'.random_int(0, 9999),
                'match_score' => round(0.7 + (mt_rand() / mt_getrandmax()) * 0.3, 2),
            ],
            'anpr' => [
                'plate' => $this->randomPlate(),
                'confidence' => round(0.8 + (mt_rand() / mt_getrandmax()) * 0.2, 2),
                'lane' => Arr::random(['INBOUND', 'OUTBOUND']),
            ],
            default => [
                'note' => 'generic_event',
            ],
        };
    }

    private function randomPlate(): string
    {
        $letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $parts = [];

        for ($i = 0; $i < 3; $i++) {
            $parts[] = $letters[random_int(0, strlen($letters) - 1)];
        }

        return implode('', $parts).random_int(1000, 9999);
    }
}
