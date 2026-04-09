# E-mail instellen voor Hada Homes boekingen

## Stap 1: Gmail App Password aanmaken

1. Ga naar [myaccount.google.com](https://myaccount.google.com)
2. Klik op **Beveiliging** in het linkermenu
3. Zorg dat **2-staps verificatie** aanstaat (verplicht voor App Passwords)
4. Zoek naar **App-wachtwoorden** (of ga naar: https://myaccount.google.com/apppasswords)
5. Kies app: **E-mail** → apparaat: **Anders** → typ "Hada Homes"
6. Klik **Genereren** → je krijgt een 16-cijferig wachtwoord (bijv. `abcd efgh ijkl mnop`)
7. Kopieer dit wachtwoord (je ziet het maar één keer!)

## Stap 2: Environment Variables instellen in Vercel

1. Ga naar [vercel.com](https://vercel.com) → jouw project **hada-homes**
2. Klik op **Settings** → **Environment Variables**
3. Voeg toe:
   - `GMAIL_USER` = `hadahomesspain@gmail.com`
   - `GMAIL_APP_PASS` = het 16-cijferige wachtwoord (zonder spaties)
4. Klik **Save** en doe een nieuwe deployment (of push een kleine wijziging)

## Hoe het werkt

Wanneer een gast een boekingsaanvraag verstuurt:
1. **Kevin & Sophie** ontvangen een e-mail op hadahomesspain@gmail.com met alle details
2. **De gast** ontvangt een bevestigingsmail met referentienummer en vervolgstappen
3. Als de e-mail mislukt → **WhatsApp fallback** opent automatisch met alle info

## WhatsApp nummer
Ingesteld op: **+31 6 45 18 22 46**
