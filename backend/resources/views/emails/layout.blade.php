<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@yield('subject', 'Muslim Ad Network')</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color:#1f2937;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f7fb; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05);">

          {{-- Header --}}
          <tr>
            <td style="padding:24px 32px; background:linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color:#ffffff;">
              <div style="font-size:20px; font-weight:700; letter-spacing:-0.01em;">
                Muslim Ad Network
              </div>
              <div style="font-size:13px; opacity:0.85; margin-top:2px;">
                Self-Service Advertising
              </div>
            </td>
          </tr>

          {{-- Content --}}
          <tr>
            <td style="padding:32px;">
              @yield('content')
            </td>
          </tr>

          {{-- Footer --}}
          <tr>
            <td style="padding:24px 32px; background-color:#f9fafb; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280; text-align:center;">
              <div style="margin-bottom:6px;">
                &copy; {{ now()->year }} Muslim Ad Network
              </div>
              <div style="margin-bottom:6px;">
                515 Madison Ave., Suite 9111, Manhattan, NY 10022
              </div>
              <div>
                <a href="mailto:Sales@muslimadnetwork.com" style="color:#4f46e5; text-decoration:none;">Sales@muslimadnetwork.com</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
