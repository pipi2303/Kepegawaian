<?php

namespace App\Mail;

use App\Models\Cuti;
use App\Models\Pegawai;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CutiDitolak extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Cuti $cuti,
        public Pegawai $approver,
        public string $alasan,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Permohonan Cuti Anda Ditolak');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.cuti.ditolak');
    }
}
