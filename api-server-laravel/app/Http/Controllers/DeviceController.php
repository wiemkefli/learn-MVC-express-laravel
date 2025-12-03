<?php

namespace App\Http\Controllers;

use App\Services\DeviceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class DeviceController extends Controller
{
    public function __construct(private readonly DeviceService $deviceService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $pageRaw = $request->query('page');
            $pageSizeRaw = $request->query('pageSize');
            $usePagination = $request->has('page') || $request->has('pageSize');

            $page = $pageRaw !== null ? (int) $pageRaw : 1;
            $pageSize = $pageSizeRaw !== null ? (int) $pageSizeRaw : 5;

            if ($usePagination) {
                if ($page < 1 || $pageSize < 1) {
                    throw new HttpException(400, 'page and pageSize must be positive integers');
                }

                // Guardrail to avoid unbounded requests
                $pageSize = min($pageSize, 100);
            }

            $result = $usePagination
                ? $this->deviceService->listDevices(['page' => $page, 'pageSize' => $pageSize])
                : $this->deviceService->listDevices();

            return response()->json($result);
        } catch (Throwable $e) {
            return $this->errorResponse($e);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $name = (string) $request->input('name', '');
            $deviceType = (string) $request->input('device_type', '');
            $ipAddress = (string) $request->input('ip_address', '');
            $metadata = $request->input('metadata');

            if ($name === '' || $deviceType === '' || $ipAddress === '') {
                throw new HttpException(400, 'name, device_type, ip_address are required');
            }

            $device = $this->deviceService->createDevice([
                'name' => $name,
                'device_type' => $deviceType,
                'ip_address' => $ipAddress,
                'metadata' => $metadata,
            ]);

            return response()->json($device, Response::HTTP_CREATED);
        } catch (Throwable $e) {
            return $this->errorResponse($e);
        }
    }

    public function activate(string $id): JsonResponse
    {
        try {
            $result = $this->deviceService->activateDevice($id);

            return response()->json(['ok' => true, ...$result]);
        } catch (Throwable $e) {
            return $this->errorResponse($e);
        }
    }

    public function deactivate(string $id): JsonResponse
    {
        try {
            $result = $this->deviceService->deactivateDevice($id);

            return response()->json(['ok' => true, ...$result]);
        } catch (Throwable $e) {
            return $this->errorResponse($e);
        }
    }

    private function errorResponse(Throwable $e): JsonResponse
    {
        $status = $e instanceof HttpExceptionInterface
            ? $e->getStatusCode()
            : Response::HTTP_INTERNAL_SERVER_ERROR;

        $message = $e->getMessage() ?: 'Internal Server Error';

        return response()->json(['error' => $message], $status);
    }
}
