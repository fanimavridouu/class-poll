# Google Sheet + Apps Script

Το στατικό site στο GitHub Pages μιλάει με αυτό το script. Το ίδιο το script δημιουργεί το spreadsheet και τα φύλλα `Topics` / `Choices` στην πρώτη εκτέλεση.

## 1. Φτιάξε το script

1. Άνοιξε [script.google.com](https://script.google.com) με τον λογαριασμό σου.
2. Νέο project. Αντίγραψε τα περιεχόμενα του `Code.gs` και του `appsscript.json`.
3. **Εκτέλεσε** τη συνάρτηση `setup` μία φορά (Run). Δώσε άδεια στα spreadsheets.
4. Στο ημερολόγιο εκτέλεσης (Execution log) θα δεις το URL του νέου Sheet. Τα θέματα γεμίζουν αυτόματα από τη λίστα του `topics.txt`.

Εναλλακτικά: δημιούργησε ένα κενό Google Sheet, **Extensions → Apps Script**, κόλλησε τον κώδικα, και το script θα δεθεί με αυτό το βιβλίο.

## 2. Ιδιότητες script

Project Settings → Script properties:

| Όνομα | Τιμή |
| --- | --- |
| `ADMIN_EMAILS` | Το Gmail σου. Πολλά emails χωρισμένα με κόμμα. |
| `GOOGLE_CLIENT_ID` | Το Web client ID από το Google Cloud (το ίδιο με το `config.js`). |
| `SPREADSHEET_ID` | Μπαίνει μόνο του από την `setup`. |

## 3. Web app

Deploy → New deployment → Type: **Web app**

- Execute as: **Me**
- Who has access: **Anyone**

Αντίγραψε το URL (`…/exec`) στο `config.js` ως `APPS_SCRIPT_URL`.

Μετά από κάθε αλλαγή στον κώδικα: Deploy → Manage deployments → Edit → **New version**.

## 4. Google Sign-In (admin)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create credentials → OAuth client ID → **Web application**.
2. Authorized JavaScript origins:
   - `http://127.0.0.1:8080`
   - `http://localhost:8080`
   - `https://<user>.github.io`
   - αν το Pages είναι project site: `https://<user>.github.io/<repo>`
3. Το Client ID πάει στο `config.js` **και** στο Script property `GOOGLE_CLIENT_ID`.

## Φύλλα

Δομή (ίδια με τα CSV στο `sheets/`):

- `Topics`: `id`, `title`, `capacity` (προεπιλογή 4)
- `Choices`: `timestamp`, `first_name`, `last_name`, `normalized_name`, `topic_id`, `topic_title`

Μην μοιράζεσαι το Sheet με την τάξη. Η φόρμα γράφει μέσω του web app, που τρέχει ως εσύ.
