<?php

namespace App\Mail;

use App\Models\Pegawai;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LisensiKadaluarsaSoon extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Pegawai $pegawai,
        public int $hariTersisa,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Peringatan: STR/SIP Akan Kadaluarsa dalam {$this->hariTersisa} Hari",
        );
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.lisensi.expiry');
    }
}
