<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
     * Gmail API credentials — mirrors the reporting dashboard
     * (/var/www/muslimadnetwork-reporting/backend) so both projects share a
     * single Google OAuth app and refresh token. See GmailMailerService and
     * GmailApiTransport.
     */
    'gmail' => [
        'client_id'     => env('GMAIL_OAUTH_CLIENT_ID'),
        'client_secret' => env('GMAIL_OAUTH_CLIENT_SECRET'),
        'refresh_token' => env('GMAIL_REFRESH_TOKEN'),
        'from_address'  => env('GMAIL_FROM_ADDRESS'),
    ],

    /*
     * Mattermost incoming webhook for "new paid signup" notifications. Empty
     * URL → MattermostNotifier returns early without erroring, so payment
     * processing keeps working until Ashraf provisions the webhook.
     */
    'mattermost' => [
        'advertise_webhook_url' => env('MATTERMOST_WEBHOOK_URL_ADVERTISE'),
    ],

];
