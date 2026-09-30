<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePegawaiRequest extends FormRequest
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
        $pegawaiId = $this->route('pegawai')?->id;

        return [
            'nip' => 'required|string|max:30|unique:m_pegawai,nip,' . $pegawaiId,
            'nama' => 'required|string|max:255',
            'gelar_depan' => 'nullable|string|max:50',
            'gelar_belakang' => 'nullable|string|max:50',
            'jenis_kelamin' => 'required|in:L,P',
            'jabatan' => 'required|string|max:150',
            'unit_kerja' => 'required|string|max:150',
            'golongan' => 'nullable|string|max:10',
            'pangkat' => 'nullable|string|max:100',
            'status_pegawai' => 'required|in:PNS,PPPK,Honorer',
            'status_aktif' => 'required|in:Aktif,Pensiun,Meninggal,Diberhentikan',
            'email' => 'nullable|email|max:100|unique:m_pegawai,email,' . $pegawaiId,
            'no_telp' => 'nullable|string|max:25',
        ];
    }
}
