<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 255);
            $table->enum('device_type', ['access_controller', 'face_reader', 'anpr']);
            $table->string('ip_address', 45)->unique();
            $table->enum('status', ['inactive', 'active'])->default('inactive');
            $table->json('metadata')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();

            $table->index('device_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
