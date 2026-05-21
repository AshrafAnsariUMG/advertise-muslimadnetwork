<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Idempotent admin user seeder.
 *
 * First run: creates the admin and **prints the generated password ONCE**
 * to stdout (and writes it nowhere else). The operator must capture it.
 *
 * Subsequent runs: detects the existing user and skips. To regenerate the
 * password, manually `DELETE FROM users WHERE email='...';` first.
 *
 * This is a deliberate trade-off: no forgot-password flow in v1, but no
 * password is ever committed to the codebase or written to disk either.
 * Reset cost is "DBA-level effort", which is acceptable for a single-admin
 * launch.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('ADMIN_INITIAL_EMAIL', 'ashraf@muslimadnetwork.com');

        if (User::where('email', $email)->exists()) {
            $this->command?->warn("Admin already exists ({$email}), skipping. "
                . 'To regenerate the password, DELETE the row first.');
            return;
        }

        $password = Str::password(20);
        $name = $this->deriveName($email);

        User::create([
            'name'              => $name,
            'email'             => $email,
            'password'          => Hash::make($password),
            'email_verified_at' => now(),
            'role'              => UserRole::Admin,
        ]);

        $banner = str_repeat('=', 60);
        $this->command?->line('');
        $this->command?->line($banner);
        $this->command?->line('ADMIN USER CREATED');
        $this->command?->line('');
        $this->command?->line("Email:    {$email}");
        $this->command?->line("Password: {$password}");
        $this->command?->line('');
        $this->command?->warn('SAVE THIS PASSWORD — it will not be shown again.');
        $this->command?->line('Change it after first login via the admin profile page (S10+).');
        $this->command?->line($banner);
        $this->command?->line('');
    }

    private function deriveName(string $email): string
    {
        $local = strtok($email, '@') ?: 'Admin';
        return ucfirst(strtolower($local));
    }
}
