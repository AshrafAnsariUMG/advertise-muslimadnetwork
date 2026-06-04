<?php

namespace App\Http\Requests;

use App\Models\Advertiser;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class UploadFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'advertiser_id' => ['required', 'uuid', 'exists:advertisers,id'],
            'access_token'  => ['required', 'string', 'size:64'],
            // Broad gate only — UploadController does genuine type detection
            // and enforces the per-type rules: images must be one of the four
            // banner sizes (≤2 MB); videos (CTV only) ≤100 MB. The 100 MB cap
            // here is the outer ceiling for video.
            'file'          => ['required', 'file', 'mimes:jpeg,jpg,png,mp4,mov,webm', 'max:102400'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if ($v->errors()->hasAny(['advertiser_id', 'access_token'])) {
                return;
            }

            $advertiser = Advertiser::find($this->input('advertiser_id'));
            if (!$advertiser || !hash_equals($advertiser->access_token, (string) $this->input('access_token'))) {
                $v->errors()->add('access_token', 'Invalid access_token for this advertiser.');
            }
        });
    }
}
