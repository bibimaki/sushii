# 🍣 ซูชิวังหน้า — QR Ordering System

เวอร์ชันปรับปรุงสำหรับงานส่ง/เดโม:

- 🎨 UI มีสีสันและ Responsive
- 📱 หน้าเปิดโต๊ะมีจำนวนผู้ใหญ่/เด็กก่อนสร้าง QR
- 📋 ปุ่มคัดลอกลิงก์สั่งอาหารหลังสร้าง QR
- ➕➖ เพิ่ม/ลดจำนวนอาหารจากหน้าเมนูและตะกร้า
- 👨‍🍳 จอครัวแบ่งสถานะด้วยสี: รอรับออเดอร์ / กำลังทำ / พร้อมเสิร์ฟ
- 🟠 รับออเดอร์ → 🔵 ทำออเดอร์เสร็จ → 🟢 เสร็จสิ้น
- ⚡ Realtime ผ่าน Supabase

## สำคัญ: Database migration

ถ้าฐานข้อมูลเดิมมีตาราง `sessions` อยู่แล้ว ให้รันไฟล์:

`supabase/migration_people_count.sql`

ใน Supabase SQL Editor **ก่อน** ใช้หน้าเปิดโต๊ะเวอร์ชันนี้

ถ้าสร้างฐานข้อมูลใหม่ ให้ใช้ `supabase/schema.sql` ได้เลย

## Environment

สร้าง `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Run

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000`
