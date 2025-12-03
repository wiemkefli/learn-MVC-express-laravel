<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_status_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('device_id');
            $table->enum('old_status', ['inactive', 'active']);
            $table->enum('new_status', ['inactive', 'active']);
            $table->string('reason', 255)->nullable();
            $table->dateTime('changed_at', 6)->useCurrent();

            $table->index(['device_id', 'changed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_status_history');
    }
};
