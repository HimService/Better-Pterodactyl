<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Pterodactyl\Models\User;
use BetterPterodactyl\Discord\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;

if (!class_exists('BetterPterodactyl\Discord\DB')) {
    require_once base_path('resources/settings/discord/helpers.php');
}

Route::get('/api/discord/config', function () {
    $settings = DB::getSettings();
    // Only return public config
    return response()->json([
        'enabled' => (bool)$settings['enabled'],
    ]);
});

Route::get('/api/discord/login', function () {
    $settings = DB::getSettings();
    if (!$settings['enabled']) return redirect('/auth/login');

    $query = http_build_query([
        'client_id' => $settings['client_id'],
        'redirect_uri' => $settings['redirect_url'],
        'response_type' => 'code',
        'scope' => 'identify email',
    ]);

    return redirect('https://discord.com/api/oauth2/authorize?' . $query);
});

Route::get('/auth/login/discord/callback', function (Request $request) {
    $settings = DB::getSettings();
    $code = $request->query('code');
    
    if (!$code) return redirect('/auth/login?error=missing_code');

    $response = Http::asForm()->post('https://discord.com/api/oauth2/token', [
        'client_id' => $settings['client_id'],
        'client_secret' => $settings['client_secret'],
        'grant_type' => 'authorization_code',
        'code' => $code,
        'redirect_uri' => $settings['redirect_url'],
    ]);

    if (!$response->successful()) return redirect('/auth/login?error=discord_token_failed');

    $accessToken = $response->json()['access_token'];
    $userResponse = Http::withToken($accessToken)->get('https://discord.com/api/users/@me');

    if (!$userResponse->successful()) return redirect('/auth/login?error=discord_user_failed');

    $discordUser = $userResponse->json();
    $discordId = $discordUser['id'];
    $email = $discordUser['email'];

    $existingLink = DB::getUserByDiscordId($discordId);
    
    if ($existingLink) {
        $user = User::find($existingLink['user_id']);
        if ($user) {
            Auth::login($user, true);
            return redirect('/');
        }
    }

    // Try to find by email
    $user = User::where('email', $email)->first();
    if ($user) {
        DB::linkUser($user->id, $discordId, $discordUser['username']);
        Auth::login($user, true);
        return redirect('/');
    }

    // Registration
    if (!$settings['allow_registration']) {
        return redirect('/auth/login?error=registration_disabled');
    }

    // Create new user
    try {
        $user = new User();
        $user->uuid = \Illuminate\Support\Str::uuid()->toString();
        // Sanitize username: only alphanumeric and underscores
        $baseUsername = preg_replace('/[^a-zA-Z0-9_]/', '', $discordUser['username']);
        if (empty($baseUsername)) $baseUsername = 'user';
        
        // Ensure unique username
        $username = $baseUsername;
        $counter = 1;
        while (User::where('username', $username)->exists()) {
            $username = $baseUsername . $counter;
            $counter++;
        }
        
        $user->username = $username;
        $user->email = $email;
        $user->name_first = $discordUser['username'];
        $user->name_last = 'Discord';
        $user->password = \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(32));
        $user->language = 'en';
        $user->root_admin = false;
        $user->save();

        DB::linkUser($user->id, $discordId, $discordUser['username']);
        
        Auth::login($user, true);
        return redirect('/');
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('Discord Registration Error: ' . $e->getMessage());
        return redirect('/auth/login?error=registration_failed_exception');
    }
});
