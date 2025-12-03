<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('transaction_id')->primary();
            $table->uuid('device_id');
            $table->string('username', 255)->nullable();
            $table->string('event_type', 64);
            $table->dateTime('timestamp', 6)->useCurrent();
            $table->json('payload')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();

            $table->index(['device_id', 'timestamp']);
            $table->index('timestamp');
            $table->index('event_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
