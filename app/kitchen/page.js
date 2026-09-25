"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const columns = [
  { status: "received", title: "รอรับออเดอร์", icon: "🆕", color: "orange" },
  { status: "preparing", title: "กำลังทำออเดอร์", icon: "👨‍🍳", color: "blue" },
  { status: "ready", title: "พร้อมเสิร์ฟ", icon: "🍣", color: "green" },
];

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => loadOrders()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .neq("status", "served")
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setOrders(data || []);
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      setMessage(error.message);
      return;
    }
    await loadOrders();
  }

  function actionFor(order) {
    if (order.status === "received") {
      return { text: "รับออเดอร์", next: "preparing", className: "status-action orange" };
    }
    if (order.status === "preparing") {
      return { text: "ทำออเดอร์เสร็จ", next: "ready", className: "status-action blue" };
    }
    return { text: "เสร็จสิ้น", next: "served", className: "status-action green" };
  }

  return (
    <main className="container kitchen-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">KITCHEN DISPLAY</div>
          <h1>👨‍🍳 จอจัดออเดอร์ — ครัวซูชิวังหน้า</h1>
          <p className="muted">ออเดอร์จะอัปเดตแบบเรียลไทม์</p>
        </div>
        <div className="live-badge">● LIVE</div>
      </div>

      {message && <p className="notice error">{message}</p>}

      <div className="kitchen-grid">
        {columns.map((column) => {
          const columnOrders = orders.filter((order) => order.status === column.status);
          return (
            <section className={`kitchen-column ${column.color}`} key={column.status}>
              <div className="column-header">
                <div>
                  <h2>{column.icon} {column.title}</h2>
                  <span>{columnOrders.length} ออเดอร์</span>
                </div>
              </div>

              {columnOrders.length === 0 && <div className="empty-column">ยังไม่มีออเดอร์</div>}

              {columnOrders.map((order) => {
                const action = actionFor(order);
                return (
                  <div className={`order-card ${column.color}`} key={order.id}>
                    <div className="order-top">
                      <div>
                        <span className="table-tag">โต๊ะ {order.table_number}</span>
                        <small>{new Date(order.created_at).toLocaleString("th-TH")}</small>
                      </div>
                      <strong>#{order.id.slice(0, 5)}</strong>
                    </div>

                    <div className="order-items">
                      {order.items.map((item, index) => (
                        <div className="order-item" key={index}>
                          <span>{item.name}</span>
                          <strong>× {item.quantity}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="order-bottom">
                      <strong>{Number(order.total).toLocaleString()} บาท</strong>
                      <button className={action.className} onClick={() => updateStatus(order.id, action.next)}>
                        {action.text}
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </main>
  );
}
