<?php

namespace App\Http\Controllers;

use App\Services\TransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class TransactionController extends Controller
{
    public function __construct(private readonly TransactionService $transactionService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $transactions = $this->transactionService->listTransactions([
                'limit' => $request->query('limit', 100),
                'device_id' => $request->query('device_id'),
                'event_type' => $request->query('event_type'),
            ]);

            return response()->json($transactions);
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
