"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function OrderPage() {
  const params = useParams();
  const tableNumber = decodeURIComponent(params.tableNumber);

  const [session, setSession] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, [tableNumber]);

  async function loadData() {
    setLoading(true);

    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("table_number", tableNumber)
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      setMessage(sessionError.message);
      setLoading(false);
      return;
    }

    const { data: categoryData, error: categoryError } = await supabase
      .from("menu_categories")
      .select("*")
      .order("sort_order");

    const { data: menuData, error: menuError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_available", true);

    if (categoryError || menuError) {
      setMessage(categoryError?.message || menuError?.message);
      setLoading(false);
      return;
    }

    setSession(sessionData);
    setCategories(categoryData || []);
    setMenuItems(menuData || []);
    setLoading(false);
  }

  function getQuantity(id) {
    return cart.find((item) => item.id === id)?.quantity || 0;
  }

  function changeQuantity(item, delta) {
    setCart((current) => {
      const found = current.find((x) => x.id === item.id);

      if (!found && delta > 0) {
        return [
          ...current,
          {
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: 1,
          },
        ];
      }

      return current
        .map((x) =>
          x.id === item.id ? { ...x, quantity: x.quantity + delta } : x
        )
        .filter((x) => x.quantity > 0);
    });
  }

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  async function submitOrder() {
    if (!session) {
      setMessage("ไม่พบโต๊ะที่เปิดอยู่");
      return;
    }

    if (cart.length === 0) {
      setMessage("กรุณาเลือกอาหาร");
      return;
    }

    setSending(true);
    setMessage("");

    const { error } = await supabase.from("orders").insert({
      session_id: session.id,
      table_number: tableNumber,
      items: cart,
      total,
      status: "received",
    });

    if (error) {
      setMessage(error.message);
      setSending(false);
      return;
    }

    setCart([]);
    setMessage("ส่งออเดอร์ไปที่ครัวเรียบร้อยแล้ว 🎉");
    setSending(false);
  }

  if (loading) {
    return <main className="container loading-page">กำลังโหลดเมนู...</main>;
  }

  if (!session) {
    return (
      <main className="container">
        <h1>🍣 ซูชิวังหน้า</h1>
        <p className="error">โต๊ะนี้ยังไม่ได้เปิดใช้งาน หรือ Session ถูกปิดแล้ว</p>
      </main>
    );
  }

  return (
    <main className="container customer-page">
      <header className="customer-header">
        <div>
          <div className="eyebrow">SUSHI WANGNA</div>
          <h1>🍣 เมนูซูชิวังหน้า</h1>
          <p>โต๊ะ {tableNumber} • 👨‍👩‍👧 ผู้ใหญ่ {session.adult_count ?? 1} • 🧒 เด็ก {session.child_count ?? 0}</p>
        </div>
        <div className="table-pill">โต๊ะ {tableNumber}</div>
      </header>

      {categories.map((category) => {
        const items = menuItems.filter((item) => item.category_id === category.id);
        if (items.length === 0) return null;

        return (
          <section key={category.id} className="menu-section">
            <div className="category-heading">
              <h2>{category.name}</h2>
              <span>{items.length} เมนู</span>
            </div>

            <div className="menu-grid">
              {items.map((item) => {
                const quantity = getQuantity(item.id);
                return (
                  <div className={`menu-card ${quantity ? "selected" : ""}`} key={item.id}>
                    <div className="menu-image-wrap">
                      {item.image_url ? (
                        <img className="menu-image" src={item.image_url} alt={item.name} />
                      ) : (
                        <div className="menu-placeholder">🍣</div>
                      )}
                    </div>
                    <div className="menu-info">
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <strong>{Number(item.price).toLocaleString()} บาท</strong>
                    </div>
                    <div className="quantity-control">
                      <button className="qty-minus" onClick={() => changeQuantity(item, -1)} disabled={!quantity}>−</button>
                      <span>{quantity}</span>
                      <button className="qty-plus" onClick={() => changeQuantity(item, 1)}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="cart-card">
        <div className="cart-header">
          <div>
            <div className="eyebrow">YOUR ORDER</div>
            <h2>🛒 รายการที่เลือก</h2>
          </div>
          <div className="cart-count">{itemCount} รายการ</div>
        </div>

        {cart.length === 0 ? (
          <p className="muted">ยังไม่มีรายการ เลือกเมนูด้านบนได้เลย</p>
        ) : (
          <div className="cart-list">
            {cart.map((item) => (
              <div className="cart-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <div className="muted">{Number(item.price).toLocaleString()} บาท / ชิ้น</div>
                </div>
                <div className="cart-actions">
                  <button onClick={() => changeQuantity(item, -1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => changeQuantity(item, 1)}>+</button>
                  <strong className="line-total">{(item.price * item.quantity).toLocaleString()} บาท</strong>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="cart-total">
          <span>ยอดรวม</span>
          <strong>{total.toLocaleString()} บาท</strong>
        </div>

        <button className="submit-order-button" onClick={submitOrder} disabled={cart.length === 0 || sending}>
          {sending ? "กำลังส่งออเดอร์..." : "🍣 ส่งออเดอร์ไปที่ครัว"}
        </button>

        {message && <p className="notice success">{message}</p>}
      </section>
    </main>
  );
}
