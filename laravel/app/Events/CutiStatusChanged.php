<?php

namespace App\Events;

use App\Models\Cuti;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CutiStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Cuti $cuti,
        public string $newStatus,
        public string $catatan = ''
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('pegawai.' . $this->cuti->pegawai_id)];
    }

    public function broadcastWith(): array
    {
        return [
            'id'        => $this->cuti->id,
            'type'      => 'cuti_status',
            'title'     => "Cuti {$this->newStatus}",
            'message'   => "Permohonan {$this->cuti->jenis_cuti} Anda telah {$this->newStatus}",
            'status'    => $this->newStatus,
            'catatan'   => $this->catatan,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'cuti.status_changed';
    }
}
