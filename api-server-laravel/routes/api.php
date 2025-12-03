<?php

use App\Http\Controllers\DeviceController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::prefix('devices')->group(function () {
    Route::get('/', [DeviceController::class, 'index']);
    Route::post('/', [DeviceController::class, 'store']);
    Route::post('{id}/activate', [DeviceController::class, 'activate']);
    Route::post('{id}/deactivate', [DeviceController::class, 'deactivate']);
});

Route::get('/transactions', [TransactionController::class, 'index']);
