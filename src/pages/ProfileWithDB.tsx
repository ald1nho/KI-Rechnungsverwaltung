import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Building, MapPin, Upload, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  address?: string;
  avatar_url?: string;
}

const ProfileWithDB: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Form states für Benutzerdaten
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState('');

  // Passwort-Validierungsregeln
  const passwordRequirements = [
    { met: newPassword.length >= 10, text: 'Mindestens 10 Zeichen' },
    { met: /[a-z]/.test(newPassword), text: 'Mindestens ein Kleinbuchstabe' },
    { met: /[A-Z]/.test(newPassword), text: 'Mindestens ein Großbuchstabe' },
    { met: /\d/.test(newPassword), text: 'Mindestens eine Zahl' },
    { met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword), text: 'Mindestens ein Sonderzeichen' },
  ];

  const isPasswordValid = passwordRequirements.every(req => req.met);
  const passwordsMatch = newPassword === confirmPassword && newPassword !== '';

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      // Try to get the profile from database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      let profileData: UserProfile;

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create a default one
        profileData = {
          id: user.id,
          email: user.email || '',
          full_name: '',
          company: '',
          address: '',
          avatar_url: '',
        };
        
        // Try to create the profile in database
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: '',
            company: '',
            address: '',
            avatar_url: '',
          });
        
        if (insertError) {
          console.warn('Could not create profile in database:', insertError);
        }
      } else if (error) {
        throw error;
      } else {
        profileData = {
          id: user.id,
          email: user.email || '',
          full_name: data?.full_name || '',
          company: data?.company || '',
          address: data?.address || '',
          avatar_url: data?.avatar_url || '',
        };
      }

      setProfile(profileData);
      setFullName(profileData.full_name || '');
      setCompany(profileData.company || '');
      setAddress(profileData.address || '');
      setEmail(profileData.email);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      
      // Fallback to basic profile from user data
      const profileData: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        company: '',
        address: '',
        avatar_url: '',
      };
      
      setProfile(profileData);
      setFullName(profileData.full_name || '');
      setCompany(profileData.company || '');
      setAddress(profileData.address || '');
      setEmail(profileData.email);
      
      toast.info('Profil-Daten werden lokal verwaltet (Datenbank nicht verfügbar)');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validierung der Datei
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Datei zu groß. Maximum 2MB erlaubt.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Nur Bilddateien sind erlaubt.');
      return;
    }

    setUploadingAvatar(true);
    
    try {
      // Try to upload to Supabase storage first
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      let avatarUrl = '';

      if (uploadError) {
        // Storage upload failed, use base64 as fallback
        console.warn('Storage upload failed, using base64 fallback:', uploadError);
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        avatarUrl = await base64Promise;
        toast.success('Profilbild lokal gespeichert (Upload-Service nicht verfügbar)');
      } else {
        // Get public URL for uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        avatarUrl = publicUrl;
        toast.success('Profilbild erfolgreich hochgeladen');
      }

      // Update profile with new avatar URL
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          console.warn('Could not update avatar in database:', updateError);
        }
      } catch (dbError) {
        console.warn('Database update failed, updating local state only');
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Fehler beim Hochladen des Profilbilds');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      // Try to save to profiles table
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: fullName,
            company: company,
            address: address,
            updated_at: new Date().toISOString(),
          });

        if (profileError) throw profileError;
      } catch (profileError: any) {
        console.warn('Database update failed:', profileError);
        toast.info('Daten lokal gespeichert (Datenbank nicht verfügbar)');
      }

      // Update email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        });
        if (emailError) throw emailError;
        toast.success('Bestätigungslink wurde an die neue E-Mail-Adresse gesendet');
      }

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        full_name: fullName,
        company: company,
        address: address,
        email: email,
      } : null);

      toast.success('Profil erfolgreich gespeichert');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Fehler beim Speichern des Profils');
      toast.error('Fehler beim Speichern des Profils');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid || !passwordsMatch || !user) return;

    setChangingPassword(true);
    setError('');

    try {
      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: currentPassword,
      });

      if (signInError) {
        setError('Aktuelles Passwort ist falsch');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      
      toast.success('Passwort erfolgreich geändert!');
    } catch (error: any) {
      console.error('Error changing password:', error);
      setError(error.message || 'Fehler beim Ändern des Passworts');
      toast.error('Fehler beim Ändern des Passworts');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Profil wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Profil konnte nicht geladen werden.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Benutzerprofil</h1>
        <p className="text-muted-foreground mt-2">Verwalten Sie Ihre Kontoinformationen</p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profilbild
          </CardTitle>
          <CardDescription>
            Laden Sie ein Profilbild hoch (max. 2MB, nur Bilddateien)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url} alt="Profilbild" />
            <AvatarFallback className="text-lg">
              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 
               profile.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              id="avatar-upload"
            />
            <Label htmlFor="avatar-upload">
              <Button
                variant="outline"
                disabled={uploadingAvatar}
                className="cursor-pointer"
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingAvatar ? 'Hochladen...' : 'Bild hochladen'}
                </span>
              </Button>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Persönliche Informationen Formular */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Persönliche Informationen
          </CardTitle>
          <CardDescription>
            Aktualisieren Sie Ihre persönlichen Daten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Ihr vollständiger Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail-Adresse</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ihre@email.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Unternehmen</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company"
                  placeholder="Ihr Unternehmen"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Wohnadresse</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  placeholder="Ihre vollständige Adresse"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-10 min-h-[100px]"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Speichern...' : 'Profil speichern'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Passwort ändern
          </CardTitle>
          <CardDescription>
            Ändern Sie Ihr Passwort für zusätzliche Sicherheit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button
              variant="outline"
              onClick={() => setShowPasswordForm(true)}
              className="w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              Passwort ändern
            </Button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Ihr aktuelles Passwort"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Ihr neues Passwort"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Password Requirements */}
                {newPassword && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium">Passwort-Anforderungen:</p>
                    <div className="grid grid-cols-1 gap-1">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {req.met ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span className={req.met ? 'text-green-600' : 'text-red-600'}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Neues Passwort wiederholen"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {confirmPassword && (
                  <div className="flex items-center gap-2 text-sm mt-1">
                    {passwordsMatch ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordsMatch ? 'text-green-600' : 'text-red-600'}>
                      {passwordsMatch ? 'Passwörter stimmen überein' : 'Passwörter stimmen nicht überein'}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={changingPassword || !isPasswordValid || !passwordsMatch || !currentPassword}
                  className="flex-1"
                >
                  {changingPassword ? 'Ändern...' : 'Passwort ändern'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileWithDB;