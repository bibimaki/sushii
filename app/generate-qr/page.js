"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";

export default function GenerateQRPage() {
  const [tableNumber, setTableNumber] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [qrUrl, setQrUrl] = useState("");
  const [orderUrl, setOrderUrl] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function makeQR(url) {
    setOrderUrl(url);
    setQrUrl(await QRCode.toDataURL(url, { width: 420, margin: 2 }));
  }

  async function openTable() {
    const table = tableNumber.trim();
    const adultCount = Math.max(0, Number(adults) || 0);
    const childCount = Math.max(0, Number(children) || 0);

    if (!table) {
      setMessage("กรุณากรอกหมายเลขโต๊ะ");
      setMessageType("error");
      return;
    }

    if (adultCount + childCount < 1) {
      setMessage("กรุณาระบุจำนวนผู้ใหญ่หรือเด็กอย่างน้อย 1 คน");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setCopied(false);

    try {
      const { data: existing, error: existingError } = await supabase
        .from("sessions")
        .select("*")
        .eq("table_number", table)
        .eq("status", "open")
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError) throw existingError;

      const url = `${window.location.origin}/order/${encodeURIComponent(table)}`;

      if (existing) {
        await makeQR(url);
        setAdults(existing.adult_count ?? 1);
        setChildren(existing.child_count ?? 0);
        setMessage("โต๊ะนี้เปิดใช้งานอยู่แล้ว จึงใช้ QR เดิม");
        setMessageType("info");
        return;
      }

      const { error } = await supabase.from("sessions").insert({
        table_number: table,
        adult_count: adultCount,
        child_count: childCount,
        status: "open",
      });

      if (error) throw error;

      await makeQR(url);
      setMessage("เปิดโต๊ะและสร้าง QR เรียบร้อย");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "เกิดข้อผิดพลาด");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function copyOrderLink() {
    if (!orderUrl) return;

    try {
      await navigator.clipboard.writeText(orderUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setMessage("คัดลอกไม่ได้ กรุณาคัดลอกลิงก์ด้วยตนเอง");
      setMessageType("error");
    }
  }

  return (
    <main className="container">
      <div className="page-heading">
        <div>
          <div className="eyebrow">STAFF • TABLE SETUP</div>
          <h1>🍣 เปิดโต๊ะ / สร้าง QR</h1>
          <p className="muted">ระบุจำนวนลูกค้าก่อนสร้าง QR สำหรับโต๊ะ</p>
        </div>
      </div>

      <div className="setup-layout">
        <div className="card setup-card">
          <div className="section-title">ข้อมูลโต๊ะ</div>

          <label className="field-label">
            หมายเลขโต๊ะ
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="เช่น 01 หรือ 20"
            />
          </label>

          <div className="people-grid">
            <label className="person-input adult">
              <span>👨‍👩‍👧 ผู้ใหญ่</span>
              <input
                type="number"
                min="0"
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
              />
              <small>คน</small>
            </label>

            <label className="person-input child">
              <span>🧒 เด็ก</span>
              <input
                type="number"
                min="0"
                value={children}
                onChange={(e) => setChildren(e.target.value)}
              />
              <small>คน</small>
            </label>
          </div>

          <div className="people-summary">
            👥 รวม {Number(adults) + Number(children)} คน
          </div>

          <button className="primary-button wide-button" onClick={openTable} disabled={loading}>
            {loading ? "กำลังสร้าง QR..." : "✨ เปิดโต๊ะและสร้าง QR"}
          </button>

          {message && <p className={`notice ${messageType}`}>{message}</p>}
        </div>

        {qrUrl ? (
          <div className="card qr-card">
            <div className="section-title">QR สำหรับลูกค้า</div>
            <div className="qr-frame">
              <img src={qrUrl} alt={`QR โต๊ะ ${tableNumber}`} />
            </div>
            <h2>โต๊ะ {tableNumber}</h2>
            <p className="muted">
              ผู้ใหญ่ {adults} คน • เด็ก {children} คน
            </p>

            <div className="copy-box">
              <input value={orderUrl} readOnly aria-label="ลิงก์สั่งอาหาร" />
              <button className="copy-button" onClick={copyOrderLink}>
                {copied ? "✓ คัดลอกแล้ว" : "📋 คัดลอกลิงก์"}
              </button>
            </div>
          </div>
        ) : (
          <div className="card empty-qr">
            <div className="empty-icon">📱</div>
            <h2>QR จะปรากฏตรงนี้</h2>
            <p className="muted">กรอกโต๊ะและจำนวนลูกค้า แล้วกดสร้าง QR</p>
          </div>
        )}
      </div>
    </main>
  );
}
