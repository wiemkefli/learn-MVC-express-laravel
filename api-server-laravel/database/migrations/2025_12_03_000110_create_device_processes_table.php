<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_processes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('device_id');
            $table->string('pid', 128);
            $table->dateTime('started_at', 6)->useCurrent();
            $table->dateTime('last_heartbeat_at', 6)->useCurrent();
            $table->dateTime('stopped_at', 6)->nullable();

            $table->index('device_id');
            $table->index(['device_id', 'stopped_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_processes');
    }
};
