<?php

use Illuminate\Support\Facades\Broadcast;

// Private channel per pegawai — only they can listen
Broadcast::channel('pegawai.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Role-based channels — only users with that role
Broadcast::channel('role.{role}', function ($user, $role) {
    return $user->hasRole($role);
});
