<?php

namespace App\Services;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DatabaseBootstrapper
{
    private static bool $bootstrapped = false;

    public function bootstrap(): void
    {
        if (self::$bootstrapped) {
            return;
        }

        self::$bootstrapped = true;

        $connection = Config::get('database.default');
        $config = Config::get("database.connections.$connection", []);

        if (($config['driver'] ?? null) !== 'mysql') {
            return;
        }

        $this->ensureDatabaseExists($config);

        if ($this->shouldSkipMigrations()) {
            return;
        }

        $this->runMigrations($connection);
    }

    private function ensureDatabaseExists(array $config): void
    {
        $database = $config['database'] ?? null;

        if (! $database) {
            return;
        }

        $host = $config['host'] ?? '127.0.0.1';
        $port = $config['port'] ?? 3306;
        $username = $config['username'] ?? 'root';
        $password = $config['password'] ?? '';

        $dsn = sprintf('mysql:host=%s;port=%s;', $host, $port);

        try {
            $pdo = new \PDO($dsn, $username, $password, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            ]);

            $pdo->exec(sprintf(
                'CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
                str_replace('`', '``', $database)
            ));
        } catch (\Throwable $e) {
            Log::error('Database creation failed', ['error' => $e->getMessage()]);
        } finally {
            if (isset($pdo)) {
                $pdo = null;
            }
        }
    }

    private function runMigrations(string $connection): void
    {
        try {
            DB::purge($connection);
            DB::reconnect($connection);

            Artisan::call('migrate', ['--force' => true]);
        } catch (\Throwable $e) {
            Log::error('Automatic migration failed', ['error' => $e->getMessage()]);
        }
    }

    private function shouldSkipMigrations(): bool
    {
        if (! app()->runningInConsole()) {
            return false;
        }

        $argv = $_SERVER['argv'] ?? [];
        $command = $argv[1] ?? '';

        return str_starts_with($command, 'migrate');
    }
}
