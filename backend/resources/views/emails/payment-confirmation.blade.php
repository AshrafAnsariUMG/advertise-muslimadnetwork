@extends('emails.layout')

@section('subject', 'Your campaign has been submitted!')

@section('content')
  <h1 style="margin:0 0 16px 0; font-size:24px; font-weight:700; color:#111827; line-height:1.3;">
    Your campaign has been submitted!
  </h1>

  <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">
    Hi {{ $advertiser->contact_name ?? 'there' }},
  </p>

  <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6;">
    Thanks for choosing Muslim Ad Network. Your campaign is being reviewed
    and you&rsquo;ll hear from us within 24 hours.
  </p>

  {{-- Campaign summary --}}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px 0; background-color:#f9fafb; border-radius:8px; border:1px solid #e5e7eb;">
    <tr>
      <td style="padding:16px 20px;">
        <div style="font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; margin-bottom:12px;">
          Campaign summary
        </div>

        @php
          $rows = [
            'Business'    => $advertiser->business_name,
            'Campaign'    => $advertiser->campaign_name,
            'Objective'   => $objectiveLabel,
            'Budget'      => '$' . number_format((float) $advertiser->monthly_budget, 2) . ' / month',
            'Dates'       => $datesLabel,
            'Total paid'  => '$' . number_format($total, 2),
            'Payment'     => $paymentMethodLabel,
          ];
        @endphp

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          @foreach ($rows as $label => $value)
            <tr>
              <td style="padding:6px 0; font-size:14px; color:#6b7280; width:40%;">
                {{ $label }}
              </td>
              <td style="padding:6px 0; font-size:14px; color:#111827; font-weight:500;">
                {{ $value ?: '—' }}
              </td>
            </tr>
          @endforeach
        </table>
      </td>
    </tr>
  </table>

  <h2 style="margin:0 0 12px 0; font-size:16px; font-weight:600; color:#111827;">
    What happens next
  </h2>
  <ul style="margin:0 0 24px 0; padding-left:20px; font-size:15px; line-height:1.7; color:#374151;">
    <li>Our team reviews your submission within 1&ndash;2 business days.</li>
    <li>You&rsquo;ll get an approval email when your campaign goes live.</li>
    <li>If we need any clarification on creatives or targeting, we&rsquo;ll reach out.</li>
  </ul>

  <p style="margin:0; font-size:14px; color:#6b7280;">
    Questions? Just reply to this email &mdash; it goes straight to our team.
  </p>
@endsection
