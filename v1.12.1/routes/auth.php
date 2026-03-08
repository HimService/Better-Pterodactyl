<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Auth;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
|
| Endpoint: /auth
|
*/

// These routes are defined so that we can continue to reference them programmatically.
// They all route to the same controller function which passes off to React.
Route::get('/login', [Auth\LoginController::class, 'index'])->name('auth.login');
Route::get('/password', [Auth\LoginController::class, 'index'])->name('auth.forgot-password');
Route::get('/password/reset/{token}', [Auth\LoginController::class, 'index'])->name('auth.reset');

// Apply a throttle to authentication action endpoints, in addition to the
// recaptcha endpoints to slow down manual attack spammers even more. 🤷‍
//
// @see \Pterodactyl\Providers\RouteServiceProvider
Route::middleware(['throttle:authentication'])->group(function () {
    // Login endpoints.
    Route::post('/login', function (\Illuminate\Http\Request $request) {
        if (!class_exists('BetterPterodactyl\Verification\DB')) {
            require_once base_path('resources/settings/verification/helpers.php');
        }
        $settings = \BetterPterodactyl\Verification\DB::getSettings();
        
        if ($settings['enabled']) {
            if ($settings['verification_type'] === 'turnstile') {
                $response = $request->input('cf-turnstile-response');
                $secret = $settings['turnstile_secret_key'];
                
                $verify = \Illuminate\Support\Facades\Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => $secret,
                    'response' => $response,
                    'remoteip' => $request->ip(),
                ]);
                
                if (!$verify->json('success')) {
                    return response()->json([
                        'errors' => [['code' => 'VerificationException', 'detail' => 'Cloudflare Turnstile verification failed.']]
                    ], 400);
                }
            } else {
                $response = $request->input('g-recaptcha-response');
                $secret = $settings['recaptcha_secret_key'];
                
                $verify = \Illuminate\Support\Facades\Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret' => $secret,
                    'response' => $response,
                    'remoteip' => $request->ip(),
                ]);
                
                if (!$verify->json('success')) {
                    return response()->json([
                        'errors' => [['code' => 'VerificationException', 'detail' => 'reCAPTCHA verification failed.']]
                    ], 400);
                }
            }
        }
        
        return app()->make(Auth\LoginController::class)->login($request);
    })->withoutMiddleware('recaptcha');

    Route::post('/login/checkpoint', Auth\LoginCheckpointController::class)->name('auth.login-checkpoint');

    // Forgot password route.
    Route::post('/password', function (\Illuminate\Http\Request $request) {
        if (!class_exists('BetterPterodactyl\Verification\DB')) {
            require_once base_path('resources/settings/verification/helpers.php');
        }
        $settings = \BetterPterodactyl\Verification\DB::getSettings();
        
        if ($settings['enabled']) {
            if ($settings['verification_type'] === 'turnstile') {
                $response = $request->input('cf-turnstile-response');
                $secret = $settings['turnstile_secret_key'];
                
                $verify = \Illuminate\Support\Facades\Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => $secret,
                    'response' => $response,
                    'remoteip' => $request->ip(),
                ]);
                
                if (!$verify->json('success')) {
                    return response()->json([
                        'errors' => [['code' => 'VerificationException', 'detail' => 'Cloudflare Turnstile verification failed.']]
                    ], 400);
                }
            } else {
                $response = $request->input('g-recaptcha-response');
                $secret = $settings['recaptcha_secret_key'];
                
                $verify = \Illuminate\Support\Facades\Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret' => $secret,
                    'response' => $response,
                    'remoteip' => $request->ip(),
                ]);
                
                if (!$verify->json('success')) {
                    return response()->json([
                        'errors' => [['code' => 'VerificationException', 'detail' => 'reCAPTCHA verification failed.']]
                    ], 400);
                }
            }
        }
        
        return app()->make(Auth\ForgotPasswordController::class)->sendResetLinkEmail($request);
    })->withoutMiddleware('recaptcha')->name('auth.post.forgot-password');
});

// Password reset routes. This endpoint is hit after going through
// the forgot password routes to acquire a token (or after an account
// is created).
Route::post('/password/reset', Auth\ResetPasswordController::class)->name('auth.reset-password');

// Remove the guest middleware and apply the authenticated middleware to this endpoint,
// so it cannot be used unless you're already logged in.
Route::post('/logout', [Auth\LoginController::class, 'logout'])
    ->withoutMiddleware('guest')
    ->middleware('auth')
    ->name('auth.logout');

// Catch any other combinations of routes and pass them off to the React component.
Route::fallback([Auth\LoginController::class, 'index']);
