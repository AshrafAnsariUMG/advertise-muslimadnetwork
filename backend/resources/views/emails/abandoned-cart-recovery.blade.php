@extends('emails.layout')

@section('subject', 'Pick up where you left off')

@section('content')
  <h1 style="margin:0 0 16px 0; font-size:24px; font-weight:700; color:#111827; line-height:1.3;">
    Pick up where you left off
  </h1>

  <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">
    Hi {{ $advertiser->contact_name ?? 'there' }},
  </p>

  <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6;">
    You started setting up a campaign for
    <strong>{{ $advertiser->business_name ?: 'your business' }}</strong>
    but didn&rsquo;t get to finish. Good news &mdash; your progress is saved
    for 90 days.
  </p>

  {{-- CTA button --}}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px auto;">
    <tr>
      <td align="center" style="border-radius:8px; background:linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);">
        <a href="{{ $resumeUrl }}"
           style="display:inline-block; padding:14px 28px; font-size:16px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px;">
          Continue your campaign &rarr;
        </a>
      </td>
    </tr>
  </table>

  <p style="margin:0 0 24px 0; font-size:14px; color:#6b7280; text-align:center;">
    Your information is safe and ready when you are.
  </p>

  <hr style="border:0; border-top:1px solid #e5e7eb; margin:24px 0;">

  <p style="margin:0; font-size:12px; color:#9ca3af; line-height:1.5;">
    Not interested? Just ignore this email &mdash; we won&rsquo;t follow up
    again.
  </p>
@endsection
