<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\OppeFppe;
use App\Models\OppePeerReview;
use App\Models\Pegawai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OppePeerReviewController extends Controller
{
    /** List reviewer yang ditugaskan untuk OPPE tertentu */
    public function index(OppeFppe $oppe): JsonResponse
    {
        $reviews = OppePeerReview::with('reviewer:id,nama,jabatan')
            ->where('oppe_id', $oppe->id)->get();

        return response()->json(['status' => 'success', 'data' => $reviews]);
    }

    /** Admin assign reviewer ke OPPE */
    public function assign(Request $request, OppeFppe $oppe): JsonResponse
    {
        $request->validate([
            'reviewer_ids'   => 'required|array|min:1|max:5',
            'reviewer_ids.*' => 'exists:m_pegawai,id',
        ]);

        $created = 0;
        foreach ($request->input('reviewer_ids') as $rid) {
            OppePeerReview::firstOrCreate(
                ['oppe_id' => $oppe->id, 'reviewer_id' => $rid],
                ['kompetensi_klinis' => 0, 'komunikasi' => 0, 'etika_profesional' => 0, 'kerjasama_tim' => 0, 'pengetahuan' => 0]
            ) and $created++;
        }

        return response()->json(['status' => 'success', 'data' => ['assigned' => $created]]);
    }

    /** Reviewer submit penilaian (bisa dari self-service) */
    public function submit(Request $request, OppePeerReview $review): JsonResponse
    {
        // Hanya reviewer yang bersangkutan atau admin
        if (auth()->id() !== $review->reviewer_id) {
            $this->authorize('credentialing.review-subkomite');
        }

        $validated = $request->validate([
            'kompetensi_klinis'  => 'required|numeric|between:0,100',
            'komunikasi'         => 'required|numeric|between:0,100',
            'etika_profesional'  => 'required|numeric|between:0,100',
            'kerjasama_tim'      => 'required|numeric|between:0,100',
            'pengetahuan'        => 'required|numeric|between:0,100',
            'catatan'            => 'nullable|string|max:1000',
        ]);

        $review->fill($validated);
        $review->nilai_total  = $review->hitungTotal();
        $review->submitted_at = now();
        $review->save();

        // Auto-aggregate nilai_rekan di OPPE jika semua reviewer sudah submit
        $oppe        = $review->oppe;
        $allReviews  = OppePeerReview::where('oppe_id', $oppe->id)->whereNotNull('submitted_at')->get();
        $totalAssigned = OppePeerReview::where('oppe_id', $oppe->id)->count();

        if ($allReviews->count() === $totalAssigned && $totalAssigned > 0) {
            $oppe->nilai_rekan = round($allReviews->avg('nilai_total'), 1);
            $oppe->nilai_total = $oppe->hitungNilai();
            $oppe->save();
        }

        ActivityLog::record(
            action: 'CREATE',
            targetType: 'PeerReview',
            targetId: $review->id,
            targetLabel: 'Peer Review OPPE #' . $oppe->id,
            description: "Peer review disubmit oleh reviewer #{$review->reviewer_id}. Nilai: {$review->nilai_total}.",
            request: $request,
        );

        return response()->json(['status' => 'success', 'data' => $review]);
    }

    /** Self-service: daftar OPPE yang reviewer ini perlu nilai */
    public function pending(Request $request): JsonResponse
    {
        $pending = OppePeerReview::with(['oppe.pegawai:id,nama,jabatan,unit_kerja'])
            ->where('reviewer_id', auth()->id())
            ->whereNull('submitted_at')
            ->get();

        return response()->json(['status' => 'success', 'data' => $pending]);
    }
}
