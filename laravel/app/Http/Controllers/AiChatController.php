<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiChatController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'context' => 'nullable|array',
        ]);

        $apiKey = config('services.gemini.key');
        if (!$apiKey) {
            return response()->json(['error' => 'Fitur AI tidak dikonfigurasi.'], 503);
        }

        $user    = $request->user();
        $context = $request->input('context', []);

        $systemPrompt = "Anda adalah Ask INTRAMEDIKA, asisten digital di sistem HCMS Rumah Sakit.\n"
            . "Anda berbicara dengan: {$user->nama} ({$user->jabatan}, {$user->unit_kerja}).\n"
            . "Sisa cuti tahunan: {$user->sisa_cuti_tahunan} hari.\n"
            . (isset($context['str_status']) ? "Status STR: {$context['str_status']}.\n" : '')
            . "Jawab ringkas, ramah, dalam bahasa Indonesia. "
            . "Jika tidak tahu, arahkan ke Subbag Kepegawaian (Ext. 101).";

        $response = Http::timeout(15)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}",
            [
                'contents' => [
                    ['parts' => [['text' => $systemPrompt . "\n\nPertanyaan: " . $request->input('message')]]]
                ],
            ]
        );

        if (!$response->successful()) {
            return response()->json(['error' => 'Layanan AI sedang tidak tersedia.'], 503);
        }

        $text = $response->json('candidates.0.content.parts.0.text', '');

        return response()->json(['reply' => $text]);
    }
}
