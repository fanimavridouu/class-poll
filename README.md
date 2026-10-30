# Επιλογή θέματος εργασίας

Στατική φόρμα στα ελληνικά για επιλογή **ενός** θέματος ανά ονοματεπώνυμο, με **4 θέσεις ανά θέμα**. Οι μαθητές ανοίγουν τον σύνδεσμο του GitHub Pages, χωρίς λογαριασμό.

Οι δηλώσεις αποθηκεύονται σε **Google Sheet**. Μόνο ο διαχειριστής (Google Sign-In) βλέπει τη λίστα και κατεβάζει **Excel**.

## Τι κάνει

- Δημόσια φόρμα στο `index.html`.
- Όνομα και επώνυμο (όχι email). Αυτόματο κλείδωμα θέματος μόλις συμπληρωθούν 4 συμμετοχές.
- Έλεγχος διπλοεγγραφής πριν την υποβολή. Αν υπάρχει ήδη το ίδιο ονοματεπώνυμο, εμφανίζεται σφάλμα και η φόρμα δεν στέλνεται. Το Apps Script ξαναελέγχει με κλείδωμα ώστε να μην κλαπεί η τελευταία θέση.
- Προστασία φόρμας: `preventDefault`, απενεργοποίηση κουμπιού όσο τρέχει το αίτημα, κρυφό honeypot πεδίο.
- Αποτελέσματα στο `admin.html` και εξαγωγή `.xlsx`.

**Περιορισμός:** Δεν επαληθεύει την πραγματική ταυτότητα μαθητών. Κάποιος μπορεί να γράψει άλλο όνομα. Δύο μαθητές με ακριβώς ίδιο ονοματεπώνυμο (αγνοώντας τόνους, κεφαλαία και κενά) θεωρούνται το ίδιο πρόσωπο. Η είσοδος Google προστατεύει μόνο τον διαχειριστή.

## Αρχεία

- `index.html` / `admin.html` — δημόσια φόρμα και σελίδα διαχειριστή
- `sheets/Topics.csv`, `sheets/Choices.csv` — δομή των φύλλων (το script τα δημιουργεί μόνο του)
- `apps-script/Code.gs` — backend στο Google (δημιουργεί το Sheet, μετρά θέσεις, γράφει δηλώσεις)
- `topics.txt` — η λίστα θεμάτων (ίδια με αυτή που γεμίζει το Sheet)
- `config.example.js` — υπόδειγμα ρυθμίσεων

## 1. Google Sheet και Apps Script

Δες αναλυτικά το [apps-script/README.md](apps-script/README.md). Σύνοψη:

1. Νέο project στο [script.google.com](https://script.google.com). Κόλλησε το `apps-script/Code.gs` και το `appsscript.json`.
2. Τρέξε τη συνάρτηση `setup`. Δημιουργείται spreadsheet **Επιλογή Θέματος Εργασίας** με φύλλα `Topics` (11 θέματα, 4 θέσεις) και `Choices`.
3. Script properties: `ADMIN_EMAILS` (το Gmail σου), `GOOGLE_CLIENT_ID`.
4. Deploy → Web app → Execute as **Me**, Who has access **Anyone**. Κράτα το URL `…/exec`.

## 2. Τοπική δοκιμή

```bash
copy config.example.js config.js
```

Συμπλήρωσε στο `config.js` το `APPS_SCRIPT_URL` και το `GOOGLE_CLIENT_ID`.

```bash
python -m http.server 8080
```

Άνοιξε `http://127.0.0.1:8080`. Η φόρμα είναι στην αρχική. Τα αποτελέσματα στο `http://127.0.0.1:8080/admin.html`.

Στο OAuth client πρόσθεσε origin `http://127.0.0.1:8080`.

## 3. GitHub Pages

1. Settings → Pages → Source: **GitHub Actions**.
2. Secrets του repo:
   - `APPS_SCRIPT_URL`
   - `GOOGLE_CLIENT_ID`
3. Κάνε push στο `main`. Το workflow `.github/workflows/pages.yml` ανεβάζει μόνο τα στατικά αρχεία.
4. Στο OAuth client πρόσθεσε origin `https://<user>.github.io` και, αν χρειάζεται, `https://<user>.github.io/<repo>`.

Μην ανεβάσεις το `config.js` με μυστικά· το workflow το φτιάχνει από τα secrets. Το web app URL και το OAuth client ID είναι δημόσια στο browser ούτως ή άλλως.

## 4. Αποτελέσματα

- `…/admin.html` — είσοδος Google, πίνακας δηλώσεων, κουμπί **Λήψη Excel**.
- Κράτα το `ADMIN_EMAILS` ιδιωτικό. Μην στείλεις το link των αποτελεσμάτων στην τάξη.

## Σημαντικές σημειώσεις

- Αν δύο υποβολές πάρουν την τελευταία θέση, το `LockService` στο Apps Script αφήνει μόνο τη μία να γραφτεί.
- Τα ονοματεπώνυμα είναι προσωπικά δεδομένα· ενημέρωσε την τάξη και κράτα το Sheet όσο χρειάζεται για την εργασία.
- Το GitHub Pages φιλοξενεί μόνο τη φόρμα. Τα δεδομένα μένουν στο δικό σου Google Drive.
