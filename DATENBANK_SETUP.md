# Datenbank-Setup für Benutzerprofile

## Schritt 1: SQL-Script ausführen

1. Öffne dein **Supabase Dashboard**: https://supabase.com/dashboard
2. Gehe zu deinem Projekt
3. Klicke auf **"SQL Editor"** in der linken Sidebar
4. Klicke auf **"New Query"**
5. Kopiere den Inhalt aus `create_profiles_table.sql` und füge ihn ein
6. Klicke auf **"Run"** um das Script auszuführen

## Was wird erstellt:

### ✅ Tabellen:
- **`public.profiles`** - Speichert Benutzerdaten (Name, Unternehmen, Adresse, Avatar-URL)

### ✅ Storage:
- **`avatars` Bucket** - Für Profilbilder

### ✅ Security:
- **Row Level Security (RLS)** - Benutzer können nur ihre eigenen Daten sehen/ändern
- **Storage Policies** - Sichere Avatar-Uploads

### ✅ Automatisierung:
- **Auto-Profil-Erstellung** - Neuen Benutzern wird automatisch ein Profil erstellt
- **Timestamp-Updates** - `updated_at` wird automatisch aktualisiert

## Schritt 2: Neue Komponente aktivieren

Nach dem Ausführen des SQL-Scripts, wechsle zur neuen Komponente mit echter Datenbank-Integration:

```typescript
// In src/App.tsx
import ProfileWithDB from "./pages/ProfileWithDB";
// Statt: import ProfileSimple from "./pages/ProfileSimple";

// Und Route ändern:
<Route path="/profil" element={<ProfileWithDB />} />
```

## Features der neuen Komponente:

### ✅ Echte Datenbank-Integration:
- **Profildaten** werden in Supabase gespeichert
- **Avatar-Upload** zu Supabase Storage
- **Graceful Fallbacks** wenn Datenbank nicht erreichbar

### ✅ Echte Passwort-Änderung:
- **Verifizierung** des aktuellen Passworts
- **Sichere Passwort-Updates** über Supabase Auth
- **Alle Validierungsregeln** bleiben bestehen

### ✅ Robuste Fehlerbehandlung:
- **Automatische Fallbacks** bei Datenbank-Problemen
- **Lokale Speicherung** als Backup
- **Benutzerfreundliche Fehlermeldungen**

## Troubleshooting:

### Problem: Tabelle existiert nicht
**Lösung:** SQL-Script im Supabase Dashboard ausführen

### Problem: Storage-Upload fehlschlägt
**Lösung:** Avatar wird automatisch als base64 lokal gespeichert

### Problem: Passwort-Änderung fehlschlägt
**Lösung:** Prüfe ob die E-Mail-Adresse korrekt ist