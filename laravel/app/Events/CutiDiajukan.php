<?php

namespace App\Events;

use App\Models\Cuti;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CutiDiajukan implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public Cuti $cuti) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('role.admin'),
            new PrivateChannel('role.kepala_unit'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id'        => $this->cuti->id,
            'type'      => 'cuti_diajukan',
            'title'     => 'Pengajuan Cuti Baru',
            'message'   => ($this->cuti->pegawai->nama ?? '-') . ' mengajukan ' . $this->cuti->jenis_cuti,
            'pegawai'   => $this->cuti->pegawai?->nama,
            'unit'      => $this->cuti->pegawai?->unit_kerja,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'cuti.diajukan';
    }
}
