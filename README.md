# İşletme Yönetim Sistemi API

Bu proje, işletmelerin müşteri, ürün, sipariş ve fatura yönetimini yapabilecekleri çok platformlu bir API sunmaktadır.

## Özellikler

### Firma ve Kullanıcı Yönetimi
- Çoklu firma desteği
- Her firma kendi verilerine erişebilir
- JWT tabanlı kimlik doğrulama
- Kullanıcı rolleri (admin, manager, employee)
- Şifreler bcrypt ile güvenli bir şekilde saklanır

### Ürün Yönetimi
- Ürün kategorileri oluşturma
- Stok takibi
- Ürün fiyatlandırma
- Ürün açıklamaları ve detayları

### Müşteri Yönetimi
- Müşteri kayıtları
- Müşteri sipariş geçmişi
- Müşteri iletişim bilgileri
- Müşteri bazlı raporlama

### Masa Yönetimi
- Masa ekleme ve düzenleme
- Masa durumu takibi (müsait, meşgul, rezerve)
- Masaya özel sipariş takibi
- Her firma için benzersiz masa numaraları

### Sipariş Yönetimi
- Masaya veya müşteriye sipariş oluşturma
- Sipariş durumu takibi (beklemede, hazırlanıyor, tamamlandı, iptal edildi)
- Otomatik stok düşme
- Sipariş notları
- Sipariş geçmişi

### Fatura Yönetimi
- Otomatik fatura numarası oluşturma
  * Format: FTR-YIL-AYGUN-SIRA
  * Örnek: FTR-2024-0320-0001
- Fatura durumu takibi (beklemede, ödendi, iptal edildi)
- Vade tarihi belirleme
- Fatura detayları (müşteri bilgileri, sipariş kalemleri)
- Fatura iptali
  * Ödenmiş faturalar iptal edilemez
  * İptal edildiğinde ilgili ödemeler de iptal edilir

### Ödeme Yönetimi
- Kısmi ödeme desteği
  * Bir fatura birden fazla ödeme ile kapatılabilir
  * Her ödeme için farklı ödeme yöntemi seçilebilir
- Ödeme yöntemleri
  * Nakit
  * Kredi Kartı
  * Banka Havalesi
- Ödeme kontrolleri
  * Toplam ödeme tutarı fatura tutarını geçemez
  * İptal edilmiş faturalara ödeme yapılamaz
- Ödeme iptali
  * İptal edilen ödemeler fatura tutarından düşülür
  * Tüm ödemeler iptal edilirse fatura durumu "iptal edildi" olur

## API Endpoint'leri

### Firma İşlemleri
```
POST /api/companies/register - Firma kaydı
POST /api/companies/login - Firma girişi
GET /api/companies/profile - Firma profili
```

### Kullanıcı İşlemleri
```
POST /api/users - Yeni kullanıcı oluşturma
GET /api/users - Kullanıcıları listeleme
```

### Ürün İşlemleri
```
POST /api/products - Yeni ürün ekleme
GET /api/products - Ürünleri listeleme
GET /api/products/:id - Ürün detayı
PUT /api/products/:id - Ürün güncelleme
DELETE /api/products/:id - Ürün silme
```

### Müşteri İşlemleri
```
POST /api/customers - Yeni müşteri ekleme
GET /api/customers - Müşterileri listeleme
GET /api/customers/:id - Müşteri detayı
PUT /api/customers/:id - Müşteri güncelleme
DELETE /api/customers/:id - Müşteri silme
```

### Masa İşlemleri
```
POST /api/tables - Yeni masa ekleme
GET /api/tables - Masaları listeleme
GET /api/tables/:id - Masa detayı
PUT /api/tables/:id - Masa güncelleme
DELETE /api/tables/:id - Masa silme
PUT /api/tables/:id/status - Masa durumu güncelleme
```

### Sipariş İşlemleri
```
POST /api/orders - Yeni sipariş oluşturma
GET /api/orders - Siparişleri listeleme
GET /api/orders/:id - Sipariş detayı
PUT /api/orders/:id/status - Sipariş durumu güncelleme
POST /api/orders/:id/cancel - Sipariş iptali
```

### Fatura İşlemleri
```
POST /api/invoices - Yeni fatura oluşturma
GET /api/invoices - Faturaları listeleme
GET /api/invoices/:id - Fatura detayı
POST /api/invoices/:id/cancel - Fatura iptali
```

### Ödeme İşlemleri
```
POST /api/payments - Yeni ödeme oluşturma
GET /api/payments - Ödemeleri listeleme
POST /api/payments/:id/cancel - Ödeme iptali
```

## Güvenlik Önlemleri

1. **Kimlik Doğrulama**
   - Her istek için JWT token kontrolü
   - Token'lar 24 saat geçerli
   - Her firma sadece kendi verilerine erişebilir

2. **Veri Doğrulama**
   - Tüm girdiler validate ediliyor
   - SQL injection koruması
   - XSS koruması

3. **İşlem Güvenliği**
   - Kritik işlemler transaction içinde yapılıyor
   - Hata durumunda otomatik rollback
   - Tutarlı veri garantisi

4. **Yetkilendirme**
   - Role dayalı erişim kontrolü
   - İşlem bazlı yetkilendirme
   - Güvenli şifre politikası

## Kurulum

1. Node.js'i yükleyin
2. XAMPP'i yükleyin ve MySQL servisini başlatın
3. Projeyi klonlayın
4. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
5. `.env` dosyasını düzenleyin:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=business_management_system
   JWT_SECRET=your-secret-key
   ```
6. Veritabanını oluşturun:
   - XAMPP'de phpMyAdmin'i açın
   - `database.sql` dosyasındaki SQL komutlarını çalıştırın

7. API'yi başlatın:
   ```bash
   npm start
   ```

## Teknolojiler

- Node.js
- Express.js
- MySQL
- JSON Web Token (JWT)
- bcrypt
- CORS

## Lisans

MIT 
