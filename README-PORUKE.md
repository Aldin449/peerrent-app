# SISTEM ZA PORUKE - DETALJNO OBJAŠNJENJE

## 📋 PREGLED

Ovo je sistem za poruke u PeerRent aplikaciji koji omogućava korisnicima da razgovaraju o predmetima za iznajmljivanje. Sistem je napravljen sa modernim tehnologijama i omogućava real-time komunikaciju.

## 🏗️ ARHITEKTURA

Sistem se sastoji od nekoliko ključnih dijelova:

### 1. **API RUTE** (`src/app/api/messages/`)
- **POST** - slanje nove poruke
- **GET** - dohvaćanje postojećih poruka
- **Konverzacije** - lista svih razgovora korisnika

### 2. **React Komponente** (`components/`)
- **MessageInterface** - glavni chat interface
- **ConversationList** - lista razgovora

### 3. **Custom Hooks** (`hooks/`)
- **useItemMessages** - dohvaćanje poruka i real-time slušanje
- **useSendMessage** - slanje poruka s optimističnim ažuriranjima

### 4. **Real-time Komunikacija**
- **Pusher** - servis za real-time događaje
- **WebSocket** konekcije za trenutno slanje poruka

## 🔄 KAKO FUNKCIONIŠE

### **Korak 1: Korisnik piše poruku**
1. Korisnik otvara chat interface
2. Piše poruku u textarea
3. Klikne "Pošalji" ili pritisne Enter

### **Korak 2: Optimistično ažuriranje**
1. Poruka se odmah prikazuje u chat-u (optimistično)
2. Korisnik vidi poruku bez čekanja
3. Poruka ima privremeni ID (`temp-1234567890`)

### **Korak 3: Slanje na server**
1. HTTP POST zahtjev se šalje na `/api/messages`
2. Server validira podatke
3. Poruka se sprema u bazu podataka
4. Server šalje real-time događaj preko Pushera

### **Korak 4: Real-time ažuriranje**
1. Svi korisnici koji slušaju taj kanal primaju događaj
2. Privremena poruka se zamjenjuje pravom
3. Poruka se prikazuje svim korisnicima u real-time

## 📁 STRUKTURA FAJLOVA

### **API Rute**

#### `src/app/api/messages/route.ts`
- **POST metoda**: Slanje nove poruke
  - Provjera autorizacije
  - Validacija podataka
  - Spremanje u bazu
  - Slanje real-time događaja

- **GET metoda**: Dohvaćanje poruka
  - Filtiranje po predmetu
  - Filtiranje po korisnicima
  - Autorizacija pristupa

#### `src/app/api/messages/conversations/route.ts`
- **GET metoda**: Lista svih konverzacija
  - Grupiranje poruka po predmetima
  - Sortiranje po zadnjoj poruci
  - Podaci o drugom korisniku

### **React Komponente**

#### `components/MessageInterface.tsx`
- Glavni chat interface
- Prikaz poruka
- Input za unos
- Real-time ažuriranja
- Automatski scroll na dno

### **Custom Hooks**

#### `hooks/useItemMessages.ts`
- Dohvaćanje poruka iz API-ja
- Real-time slušanje preko Pushera
- Cache management
- Sprječavanje duplikata

#### `hooks/useSendMessage.ts`
- Slanje poruka na server
- Optimistična ažuriranja
- Error handling
- Rollback funkcionalnost

## 🔐 AUTORIZACIJA I SIGURNOST

### **Kontrola pristupa**
- Samo ulogovani korisnici mogu slati/čitati poruke
- Korisnik može vidjeti samo poruke vezane za svoje predmete
- Vlasnik predmeta vidi sve poruke, kupac samo svoje

### **Validacija**
- Provjera da li predmet postoji
- Provjera da li je korisnik autorizovan
- Sanitizacija sadržaja poruke

## 💾 BAZA PODATAKA

### **Message model**
```sql
CREATE TABLE Message (
  id STRING PRIMARY KEY,
  content STRING NOT NULL,
  itemId STRING NOT NULL,
  senderId STRING NOT NULL,
  recipientId STRING NOT NULL,
  createdAt DATETIME NOT NULL,
  FOREIGN KEY (itemId) REFERENCES Item(id),
  FOREIGN KEY (senderId) REFERENCES User(id),
  FOREIGN KEY (recipientId) REFERENCES User(id)
);
```

### **Relacije**
- **Message** → **Item** (o kojem predmetu se razgovara)
- **Message** → **User** (pošiljaoc)
- **Message** → **User** (primalac)

## 🚀 REAL-TIME FUNKCIONALNOSTI

### **Pusher Kanali**
- Svaki predmet ima svoj kanal: `item-{itemId}`
- Korisnici se pretplaćuju na kanale predmeta koje prate
- Događaj `new-message` se šalje svim pretplatnicima

### **Optimistična ažuriranja**
- Poruka se prikazuje odmah (bez čekanja servera)
- Poboljšava korisničko iskustvo
- Automatski se zamjenjuje pravom porukom

## 🎯 KLJUČNE FUNKCIONALNOSTI

### **1. Chat Interface**
- ✅ Prikaz poruka u real-time
- ✅ Automatski scroll na dno
- ✅ Različiti stilovi za moje/tuđe poruke
- ✅ Prikaz vremena poruke

### **2. Slanje poruka**
- ✅ Optimistična ažuriranja
- ✅ Error handling
- ✅ Validacija input-a
- ✅ Enter za slanje, Shift+Enter za novi red

### **3. Konverzacije**
- ✅ Lista svih razgovora
- ✅ Sortiranje po zadnjoj poruci
- ✅ Prikaz naslova predmeta
- ✅ Podaci o drugom korisniku

### **4. Real-time**
- ✅ Trenutno slanje poruka
- ✅ Automatsko ažuriranje
- ✅ Sprječavanje duplikata
- ✅ WebSocket konekcije

## 🛠️ TEHNOLOGIJE

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Baza**: Prisma ORM, SQLite/PostgreSQL
- **Real-time**: Pusher
- **State Management**: React Query (TanStack Query)
- **Autentifikacija**: NextAuth.js

## 🔧 KONFIGURACIJA

### **Pusher**
```env
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
```

### **Baza podataka**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/peerrent"
```

## 📱 KORIŠTENJE

### **Za vlasnike predmeta:**
1. Otvori "My Items" stranicu
2. Klikni na predmet
3. Vidi sve poruke o tom predmetu
4. Odgovori na specifičnu poruku

### **Za kupce:**
1. Otvori stranicu predmeta
2. Klikni "Contact Owner"
3. Piši poruke vlasniku
4. Primi real-time odgovore

## 🐛 DEBUGGING

### **Console logovi**
- Sve komponente imaju detaljne console.log-ove
- Pratite tok podataka kroz sistem
- Provjerite Pusher događaje

### **Network tab**
- Pratite API pozive
- Provjerite Pusher WebSocket konekcije
- Analizirajte response podatke

## 🚨 ČESTI PROBLEMI

### **Poruka se ne prikazuje**
1. Provjeri da li je Pusher konfigurisan
2. Provjeri console za greške
3. Provjeri da li je korisnik pretplaćen na kanal

### **Duplikati poruka**
1. Provjeri optimistična ažuriranja
2. Provjeri Pusher događaje
3. Provjeri cache management

### **Poruke se ne šalju**
1. Provjeri autorizaciju
2. Provjeri validaciju podataka
3. Provjeri API endpoint

## 🔮 BUDUĆE POBOLJŠANJA

- [ ] Notifikacije za nove poruke
- [ ] Čitanje poruka (read receipts)
- [ ] Slanje slika i fajlova
- [ ] Grupne poruke
- [ ] Arhiviranje razgovora
- [ ] Pretraga poruka
- [ ] Emoji podrška
- [ ] Voice poruke

## 📚 DODATNI RESURSI

- [React Query dokumentacija](https://tanstack.com/query/latest)
- [Pusher dokumentacija](https://pusher.com/docs)
- [Next.js API routes](https://nextjs.org/docs/api-routes/introduction)
- [Prisma ORM](https://www.prisma.io/docs)

---

**Napomena**: Ovaj sistem je dizajniran da bude skalabilan i održavan. Svaki dio ima jasnu odgovornost i može se testirati i debugirati nezavisno.
