<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCutiRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'pegawai_id' => 'required|exists:m_pegawai,id',
            'jenis_cuti' => 'required|string|in:Cuti Tahunan,Cuti Sakit,Cuti Melahirkan,Cuti Besar,Cuti Alasan Penting,Cuti di Luar Tanggungan Negara',
            'tanggal_mulai' => 'required|date|after_or_equal:today',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'jumlah_hari' => 'required|integer|min:1',
            'alasan' => 'required|string|min:5|max:1000',
            'alamat_selama_cuti' => 'nullable|string|max:255',
            'no_telp_cuti' => 'nullable|string|max:30',
        ];
    }
}
