<?php

namespace App\Mail\Transport;

use App\Services\GmailMailerService;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Message;
use Symfony\Component\Mime\RawMessage;

/**
 * Symfony Mailer transport that delivers via Gmail API (OAuth2).
 *
 * Plugged into Laravel as a custom driver: `Mail::extend('gmail_api', ...)`
 * in AppServiceProvider. Set `MAIL_MAILER=gmail_api` in .env to route all
 * application mail through this transport.
 *
 * The transport just hands the fully-rendered RFC-822 stream to
 * GmailMailerService — that service handles base64url encoding and the
 * actual API call. Refresh-token authentication is set up once per
 * transport instantiation; reuse the service across mails by registering
 * it as a singleton (handled in AppServiceProvider).
 */
class GmailApiTransport extends AbstractTransport
{
    public function __construct(private GmailMailerService $gmail)
    {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $original = $message->getOriginalMessage();

        // Symfony emails are RawMessage subclasses; toString() gives the
        // serialised RFC-822 body that Gmail's users.messages.send expects.
        $raw = $original instanceof RawMessage
            ? $original->toString()
            : (string) $original;

        $this->gmail->sendRaw($raw);
    }

    public function __toString(): string
    {
        return 'gmail_api';
    }
}
