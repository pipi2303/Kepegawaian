<?php

namespace App\Mail;

use App\Models\Cuti;
use App\Models\Pegawai;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CutiDisetujui extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Cuti $cuti,
        public Pegawai $approver,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Permohonan Cuti Anda Telah Disetujui');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.cuti.disetujui');
    }
}
