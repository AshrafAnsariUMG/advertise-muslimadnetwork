<?php

namespace App\Services;

use Google\Client;
use Google\Service\Gmail;
use Google\Service\Gmail\Message;
use Illuminate\Support\Facades\Log;

/**
 * Direct Gmail-API mailer. Same pattern as the reporting dashboard
 * (`/var/www/muslimadnetwork-reporting/backend/app/Services/GmailMailerService.php`)
 * — kept identical so the two projects can share a Google OAuth client and
 * refresh token without divergence.
 *
 * Use the `Mail` facade for normal application code; that facade now routes
 * through `GmailApiTransport` which wraps this service. This class stays
 * public so utility scripts / one-shot tinker calls can fire emails without
 * spinning up Symfony Mailer.
 */
class GmailMailerService
{
    private Gmail $gmail;

    public function __construct()
    {
        $client = new Client();
        $client->setClientId(config('services.gmail.client_id'));
        $client->setClientSecret(config('services.gmail.client_secret'));
        $client->addScope(Gmail::GMAIL_SEND);

        $tokenData = $client->fetchAccessTokenWithRefreshToken(
            config('services.gmail.refresh_token')
        );

        if (isset($tokenData['error'])) {
            throw new \RuntimeException(
                'Gmail token refresh failed: ' . ($tokenData['error_description'] ?? $tokenData['error'])
            );
        }

        $this->gmail = new Gmail($client);
    }

    /**
     * Send a complete RFC-822 message via the Gmail API.
     *
     * Used by GmailApiTransport so the full Symfony envelope (multiple To,
     * Reply-To, attachments, multipart MIME) is preserved end-to-end.
     */
    public function sendRaw(string $rfc822): void
    {
        try {
            $encoded = rtrim(strtr(base64_encode($rfc822), '+/', '-_'), '=');
            $message = new Message();
            $message->setRaw($encoded);
            $this->gmail->users_messages->send('me', $message);
        } catch (\Throwable $e) {
            Log::error('GmailMailerService::sendRaw failed', [
                'error' => $e->getMessage(),
            ]);
            throw new \RuntimeException('Failed to send email: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Convenience: send a single HTML email without going through Laravel Mail.
     */
    public function send(string $to, string $subject, string $htmlBody): bool
    {
        $from    = config('services.gmail.from_address', 'support@muslimadnetwork.com');
        $rawMime = implode("\r\n", [
            'From: Muslim Ad Network <' . $from . '>',
            'To: ' . $to,
            'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            $htmlBody,
        ]);

        $this->sendRaw($rawMime);
        return true;
    }
}
